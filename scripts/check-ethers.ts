import hre from "hardhat";

async function main() {
  console.log("hre.ethers:", hre.ethers);
}

main().catch(console.error);
