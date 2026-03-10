const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment (CJS)...");
  const AtomicEscrow = await ethers.getContractFactory("AtomicEscrow");
  const escrow = await AtomicEscrow.deploy();
  await escrow.waitForDeployment();
  console.log("AtomicEscrow deployed to:", escrow.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
