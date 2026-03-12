// Standalone test script using ethers and a local Hardhat node.
// Run the node separately (`npx hardhat node`) then execute this file with
// `node scripts/test-standalone.js`.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import assert from "node:assert/strict";
import * as Ethers from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ethers = Ethers;
console.log("ethers imported?", !!ethers);
console.log("formatBytes32String" in ethers, typeof ethers.formatBytes32String);
console.log(Object.keys(ethers).filter((k) => k.includes("Bytes32")));

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signerOwner = await provider.getSigner(0);
  const signerUser = await provider.getSigner(1);
  const signerMerchant = await provider.getSigner(2);

  // deploy
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
    signerOwner,
  );
  const escrow = await factory.deploy();
  await escrow.waitForDeployment();
  console.log("deployed");

  const txId1 = ethers.encodeBytes32String("tx1");
  const amount = ethers.parseEther("1");

  // deposit and finalize
  await escrow
    .connect(signerUser)
    .depositFunds(await signerMerchant.getAddress(), txId1, { value: amount });
  await escrow.connect(signerOwner).finalizeTransaction(txId1);
  const tx1 = await escrow.transactions(txId1);
  // status is bigint; compare as string
  assert.equal(tx1.status.toString(), "1", "should be COMPLETED");
  console.log("finalize path ok");

  // deposit and refund
  const txId2 = ethers.encodeBytes32String("tx2");
  await escrow
    .connect(signerUser)
    .depositFunds(await signerMerchant.getAddress(), txId2, { value: amount });

  // advance blocks/time via RPC
  await provider.send("evm_increaseTime", [61]);
  await provider.send("evm_mine", []);

  await escrow.connect(signerUser).refundUser(txId2);
  const tx2 = await escrow.transactions(txId2);
  assert.equal(tx2.status.toString(), "2", "should be REFUNDED");
  console.log("refund path ok");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
