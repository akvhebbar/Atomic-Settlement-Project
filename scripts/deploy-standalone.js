// Standalone deployment script that connects to a running Hardhat node via RPC.
// This script is pure JavaScript and does not rely on Hardhat plugins.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as Ethers from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Ethers imported keys", Object.keys(Ethers));
const ethers = Ethers; // in v6 the top-level object

async function main() {
  // connect to local hardhat node (start one with `npx hardhat node`)
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);
  console.log("signer type", signer.constructor.name);
  try {
    console.log("signer address", await signer.getAddress());
  } catch (e) {
    console.error("could not get signer address", e);
  }

  // read compiled artifact
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "AtomicEscrow.sol",
    "AtomicEscrow.json",
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer,
  );
  console.log("Deploying AtomicEscrow...");
  const escrow = await factory.deploy();
  await escrow.waitForDeployment();
  console.log("AtomicEscrow deployed to:", escrow.target || escrow.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
