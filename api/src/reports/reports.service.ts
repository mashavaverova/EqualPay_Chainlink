import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { keccak256Utf8 } from '../common/hash';
import { canonicalizeJson } from '../common/canonicalize';
import { validateReportOrThrow } from '../common/validateReport';
import { ReportEntity } from './reports.entity';
import { computeScoreBps } from '../scoring/score';
import { getMethodologyId, METHODOLOGY_NAME } from '../scoring/methodology';
import { encodeAbiParameters, keccak256 } from 'viem';

type ReportInput = {
  company: {
    companyId: string;
  };
  period: {
    start: string;
    end: string;
  };
};
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
  ) {}

  async createReport(input: unknown) {
    validateReportOrThrow(input);

    const report = input as ReportInput;

    const canonicalJson = canonicalizeJson(report);
    const reportHash = keccak256Utf8(canonicalJson);

    const companyId = report.company.companyId;
    const periodStart = report.period.start;
    const periodEnd = report.period.end;

    const periodStartPacked = Number(periodStart.replaceAll('-', ''));
    const periodEndPacked = Number(periodEnd.replaceAll('-', ''));

    const encoded = encodeAbiParameters(
      [
        { name: 'companyId', type: 'bytes32' },
        { name: 'periodStart', type: 'uint32' },
        { name: 'periodEnd', type: 'uint32' },
        { name: 'reportHash', type: 'bytes32' },
      ],
      [
        companyId as `0x${string}`,
        periodStartPacked,
        periodEndPacked,
        reportHash,
      ],
    );

    const reportId = keccak256(encoded);

    const entity = this.reportsRepository.create({
      reportId,
      companyId,
      reportHash,
      canonicalJson,
      periodStart,
      periodEnd,
    });

    await this.reportsRepository.save(entity);

    return {
      companyId,
      reportId,
      reportHash,
    };
  }

  async getCanonicalReport(reportId: string) {
    return this.reportsRepository.findOneBy({ reportId });
  }

  async getReportMeta(reportId: string) {
    return this.reportsRepository.findOne({
      where: { reportId },
      select: [
        'reportId',
        'companyId',
        'reportHash',
        'periodStart',
        'periodEnd',
      ],
    });
  }
  async getReportScore(reportId: string) {
    const entity = await this.reportsRepository.findOneBy({ reportId });

    if (!entity) {
      return null;
    }

    const parsed = JSON.parse(entity.canonicalJson) as Parameters<
      typeof computeScoreBps
    >[0];
    const result = computeScoreBps(parsed);

    return {
      reportId,
      scoreBps: result.scoreBps,
      methodology: METHODOLOGY_NAME,
      methodologyId: getMethodologyId(),
      meanBasePayPerFte_F: result.meanBasePayPerFte_F,
      meanBasePayPerFte_M: result.meanBasePayPerFte_M,
    };
  }
}
