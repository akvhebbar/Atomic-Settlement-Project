// Plain JavaScript deployment using the built-in viem plugin (no ethers needed).
// Run with `npx hardhat run scripts/deploy.js --network hardhatMainnet` or any
// of your configured networks. This avoids the hardhat-ethers plugin issues.

import { network } from "hardhat";

async function main() {
  console.log("Starting JS deployment via viem...");

  // connect to the configured network (hardhatMainnet by default when calling
  // the script with --network hardhatMainnet)
  const connection = await network.connect();
  console.log("connection keys", Object.keys(connection));
  const { viem } = connection;
  console.log("viem", viem);

  // deploy the AtomicEscrow contract; the name must match the contract file
  if (!viem || typeof viem.deployContract !== "function") {
    throw new Error("viem not available on connection");
  }
  const escrow = await viem.deployContract("AtomicEscrow");

  // wait for the deployment to be mined (the viem object has utilities)
  await escrow.waitForDeployment();

  console.log("AtomicEscrow deployed to:", escrow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
