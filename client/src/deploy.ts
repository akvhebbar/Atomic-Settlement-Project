import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  // Get the contract factory
  // Ensure your contract file is named 'AtomicEscrow.sol' inside the 'contracts' folder
  const AtomicEscrow = await ethers.getContractFactory("AtomicEscrow");

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
