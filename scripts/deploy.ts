import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting AtomicEscrow deployment on Ganache...");

  try {
    // Connect to Ganache
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7546");
    const accounts = await provider.listAccounts();

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts available on Ganache");
    }

    const deployerAccount = accounts[0];
    console.log("📤 Deploying from account:", deployerAccount);

    // Check balance
    const balance = await provider.getBalance(deployerAccount);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    // Read compiled artifact
    const artifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      "AtomicEscrow.sol",
      "AtomicEscrow.json",
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found at ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Get signer using sendUnsignedTransaction or create a signer from a known private key
    // For Ganache deterministic accounts, use the first account directly
    const signer = await provider.getSigner();

    // Deploy contract
    console.log("⚙️  Deploying AtomicEscrow contract...");
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer,
    );

    const escrow = await factory.deploy();
    await escrow.waitForDeployment();

    const contractAddress = await escrow.getAddress();
    console.log("✅ AtomicEscrow deployed to:", contractAddress);

    // Get network info
    const network = await provider.getNetwork();
    console.log("📋 Network:", network.name, "| Chain ID:", network.chainId);

    // Save deployment info
    console.log("\n📝 Update your contract configuration:");
    console.log('export const CONTRACT_ADDRESS = "' + contractAddress + '";');
    console.log('export const MERCHANT_ADDRESS = "' + deployerAccount + '";');

    return contractAddress;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

main();
