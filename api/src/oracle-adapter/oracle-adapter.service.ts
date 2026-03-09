import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { loadLocalDeploymentConfig } from '../common/contracts.config';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class OracleAdapterService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly configService: ConfigService,
  ) {}

  async getPublishPayload(reportId: string) {
    const deployment = loadLocalDeploymentConfig();
    const score = await this.reportsService.getReportScore(reportId);
    const meta = await this.reportsService.getReportMeta(reportId);

    if (!score || !meta) {
      return null;
    }

    return {
      registryAddress: deployment.registry,
      methodologyId: score.methodologyId,
      reportId,
      scoreBps: score.scoreBps,
      companyId: meta.companyId,
      reportHash: meta.reportHash,
    };
  }

  async publishScore(reportId: string) {
    const payload = await this.getPublishPayload(reportId);

    if (!payload) {
      return null;
    }

    const privateKey =
      this.configService.get<`0x${string}`>('ORACLE_PRIVATE_KEY');
    if (!privateKey) {
      throw new Error('ORACLE_PRIVATE_KEY is missing');
    }

    const rpcUrl =
      this.configService.get<string>('RPC_URL') ?? 'http://127.0.0.1:8545';

    const account = privateKeyToAccount(privateKey);
    console.log('Oracle signer address:', account.address);

    const publicClient = createPublicClient({
      chain: hardhat,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: hardhat,
      transport: http(rpcUrl),
    });

    const registry = getContract({
      address: payload.registryAddress,
      abi: parseAbi([
        'function publishScore(bytes32 reportId, int32 scoreBps, bytes32 methodologyId) external',
      ]),
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    });

    const txHash = await registry.write.publishScore([
      payload.reportId as `0x${string}`,
      payload.scoreBps,
      payload.methodologyId,
    ]);

    return {
      txHash,
      ...payload,
    };
  }
}
