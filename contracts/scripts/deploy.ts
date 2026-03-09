import hre from "hardhat";
import { keccak256, toBytes } from "viem";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const { viem } = await hre.network.connect();
  const [deployer] = await viem.getWalletClients();

  const publicClient = await viem.getPublicClient();

  const methodologyId = keccak256(toBytes("mean_gap_v1_fte"));
  const equalityThresholdBps = 500; // 5.00%

  const badge = await viem.deployContract("EqualPayBadge", [
    "http://localhost:3000/badges/",
    deployer.account.address
  ]);

  console.log("EqualPayBadge deployed:", badge.address);

  const registry = await viem.deployContract("EqualPayRegistry", [
    equalityThresholdBps,
    methodologyId,
    deployer.account.address
  ]);

  console.log("EqualPayRegistry deployed:", registry.address);

  const registryContract = await viem.getContractAt("EqualPayRegistry", registry.address);
  const badgeContract = await viem.getContractAt("EqualPayBadge", badge.address);

  const minterRole = keccak256(toBytes("MINTER_ROLE"));
  const oracleRole = keccak256(toBytes("ORACLE_ROLE"));

  const tx1 = await registryContract.write.setBadgeContract([badge.address], {
    account: deployer.account
  });
  await publicClient.waitForTransactionReceipt({ hash: tx1 });

  const tx2 = await badgeContract.write.grantRole([minterRole, registry.address], {
    account: deployer.account
  });
  await publicClient.waitForTransactionReceipt({ hash: tx2 });

const tx3 = await registryContract.write.grantRole([oracleRole, deployer.account.address], {
  account: deployer.account
});
await publicClient.waitForTransactionReceipt({ hash: tx3 });

console.log("Badge contract linked to registry.");
console.log("Registry granted MINTER_ROLE on badge.");
console.log("Deployer granted ORACLE_ROLE on registry.");

    const deploymentsDir = path.join(process.cwd(), "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const output = {
    network: "localhost",
    registry: registry.address,
    badge: badge.address,
    equalityThresholdBps,
    methodologyId
  };

  const outputPath = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("Deployment file written to:", outputPath);
}


main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});