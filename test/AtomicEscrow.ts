import assert from "node:assert/strict";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Basic unit tests for the AtomicEscrow contract.  Covers the happy path
// and the automatic refund-on-timeout path.  These run against the
// built‑in Hardhat network (no external node required).

describe("AtomicEscrow", () => {
  it("allows a user to deposit and the owner to finalize", async function () {
    const hre = await import("hardhat");
    const { ethers } = hre;

    const [owner, user, merchant] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AtomicEscrow", owner);
    const escrow = await Factory.deploy();
    await escrow.deployed();

    const txId = ethers.utils.formatBytes32String("tx1");
    const amount = ethers.utils.parseEther("1");

    // user deposits funds
    await escrow
      .connect(user)
      .depositFunds(merchant.address, txId, { value: amount });

    // owner finalizes the transaction
    await escrow.connect(owner).finalizeTransaction(txId);

    const tx = await escrow.transactions(txId);
    assert.equal(tx.status, 1); // COMPLETED

    // merchant should have received the funds
    const bal = await ethers.provider.getBalance(merchant.address);
    assert.equal(bal.toString(), amount.toString());
  });

  it("refunds the user after the 60‑second timeout", async function () {
    const hre = await import("hardhat");
    const { ethers } = hre;

    const [owner, user, merchant] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AtomicEscrow", owner);
    const escrow = await Factory.deploy();
    await escrow.deployed();

    const txId = ethers.utils.formatBytes32String("tx2");
    const amount = ethers.utils.parseEther("1");

    await escrow
      .connect(user)
      .depositFunds(merchant.address, txId, { value: amount });

    // advance time by 61 seconds and mine a block
    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);

    // anyone (even the user) can trigger refund when expired
    await escrow.connect(user).refundUser(txId);

    const tx = await escrow.transactions(txId);
    assert.equal(tx.status, 2); // REFUNDED
  });
});
