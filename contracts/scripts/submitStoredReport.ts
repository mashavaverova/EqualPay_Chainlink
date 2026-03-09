import hre from "hardhat";
import fs from "node:fs";
import path from "node:path";
import { keccak256, toBytes } from "viem";

async function main() {
  const { viem } = await hre.network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  const deploymentPath = path.join(process.cwd(), "deployments", "localhost.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as {
    registry: `0x${string}`;
  };

  const registry = await viem.getContractAt("EqualPayRegistry", deployment.registry);

  const companyId =
    "0x1111111111111111111111111111111111111111111111111111111111111111" as const;
  const periodStart = 20250101;
  const periodEnd = 20251231;
  const reportHash =
    "0x6fd61af65c76bc1f61d5c5a60badf245c1d9e56d85c9db446b7017485b565652" as const;

  let hash = await registry.write.registerCompany([companyId, "ipfs://company-meta"], {
    account: deployer.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registry.write.submitReport(
    [companyId, periodStart, periodEnd, reportHash, "http://localhost:3000/reports"],
    { account: deployer.account },
  );
  await publicClient.waitForTransactionReceipt({ hash });

  console.log("Company registered and report submitted on-chain.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});