import hre from "hardhat";
import { keccak256, toBytes } from "viem";

async function main() {
  const { viem } = await hre.network.connect();

  const publicClient = await viem.getPublicClient();
  const [admin, companyOwner, oracle, attestor1, attestor2] = await viem.getWalletClients();

  const methodologyId = keccak256(toBytes("mean_gap_v1_fte"));
  const equalityThresholdBps = 500;

  const badge = await viem.deployContract("EqualPayBadge", [
    "http://localhost:3000/badges/",
    admin.account.address
  ]);

  const registry = await viem.deployContract("EqualPayRegistry", [
    equalityThresholdBps,
    methodologyId,
    admin.account.address
  ]);

  const registryContract = await viem.getContractAt("EqualPayRegistry", registry.address);
  const badgeContract = await viem.getContractAt("EqualPayBadge", badge.address);

  const minterRole = keccak256(toBytes("MINTER_ROLE"));
  const oracleRole = keccak256(toBytes("ORACLE_ROLE"));
  const attestorRole = keccak256(toBytes("ATTESTOR_ROLE"));

  let hash = await registryContract.write.setBadgeContract([badge.address], {
    account: admin.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await badgeContract.write.grantRole([minterRole, registry.address], {
    account: admin.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registryContract.write.grantRole([oracleRole, oracle.account.address], {
    account: admin.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registryContract.write.grantRole([attestorRole, attestor1.account.address], {
    account: admin.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registryContract.write.grantRole([attestorRole, attestor2.account.address], {
    account: admin.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const companyId = keccak256(toBytes("example-company-se"));
  const periodStart = 20250101;
  const periodEnd = 20251231;
  const reportHash = keccak256(toBytes("sample-canonical-report-json"));
  const dataURI = "http://localhost:3000/reports/example";

  hash = await registryContract.write.registerCompany([companyId, "ipfs://company-meta"], {
    account: companyOwner.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registryContract.write.submitReport(
    [companyId, periodStart, periodEnd, reportHash, dataURI],
    { account: companyOwner.account }
  );
  await publicClient.waitForTransactionReceipt({ hash });

  const reportId = keccak256(
    new Uint8Array([
      ...toBytes(companyId),
      ...toBytes(`0x${periodStart.toString(16).padStart(64, "0")}`),
      ...toBytes(`0x${periodEnd.toString(16).padStart(64, "0")}`),
      ...toBytes(reportHash)
    ])
  );

  hash = await registryContract.write.publishScore([reportId, 400, methodologyId], {
    account: oracle.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registryContract.write.attest([reportId], {
    account: attestor1.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  hash = await registryContract.write.attest([reportId], {
    account: attestor2.account
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const report = await registryContract.read.getReport([reportId]);
  const badgeOwner = await badgeContract.read.ownerOf([BigInt(reportId)]);

  console.log("Registry:", registry.address);
  console.log("Badge:", badge.address);
  console.log("reportId:", reportId);
  console.log("status:", report.status);
  console.log("scoreBps:", report.scoreBps);
  console.log("equalityAchieved:", report.equalityAchieved);
  console.log("badgeMinted:", report.badgeMinted);
  console.log("badge owner:", badgeOwner);
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});