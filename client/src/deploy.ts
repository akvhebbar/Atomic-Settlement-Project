import * as hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("Starting deployment...");
  console.log("hre available?", hre !== undefined);
  console.log("hre.ethers available?", hre.ethers !== undefined);
  if (hre.ethers === undefined) {
    console.error("hre.ethers is undefined—plugin may not be loaded");
  }

  // Get the contract factory using hre.ethers
  // Ensure your contract file is named 'AtomicEscrow.sol' inside the 'contracts' folder
  const AtomicEscrow = await hre.ethers.getContractFactory("AtomicEscrow");

  // Deploy the contract
  const escrow = await AtomicEscrow.deploy();

  // Wait for the deployment transaction to be mined
  await escrow.waitForDeployment();

  // Get the address
  const address = await escrow.getAddress();

  console.log("AtomicEscrow deployed to:", address);
}

// execute the main function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
