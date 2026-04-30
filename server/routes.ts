import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { ethers } from "ethers";
import { db } from "./db";
import { transactions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Contract details
const CONTRACT_ADDRESS = "0x6BC073124F1f14fFB40F6a8080cf33b157305C94";
const ATOMIC_ESCROW_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_merchant",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_transactionId",
        type: "bytes32",
      },
    ],
    name: "depositFunds",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_transactionId",
        type: "bytes32",
      },
    ],
    name: "finalizeTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_transactionId",
        type: "bytes32",
      },
    ],
    name: "refundUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "transactions",
    outputs: [
      {
        internalType: "address payable",
        name: "user",
        type: "address",
      },
      {
        internalType: "address payable",
        name: "merchant",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "enum AtomicEscrow.PaymentStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "isLocked",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "transactionId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "PaymentInitiated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "transactionId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "merchant",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "FundsReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "transactionId",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "RefundExecuted",
    type: "event",
  },
];

async function getOwnerSigner(provider: ethers.JsonRpcProvider) {
  // Get list of available accounts from Ganache
  const accounts = (await provider.send("eth_accounts", [])) as string[];
  console.log("🔍 Available Ganache accounts:", accounts);

  // We use Account 9 as the Oracle/Owner to avoid cluttering the User's transaction history.
  // This account will pay for gas for finalizeTransaction and refundUser calls.
  if (accounts.length >= 10) {
    console.log("🔍 Using Ganache account 9 as Oracle signer:", accounts[9]);
    return provider.getSigner(9);
  }

  console.warn("⚠️ Account 9 not found, falling back to index 0");
  return provider.getSigner(0);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Update the simulation state (triggered by the Right Column controls)
  app.post(api.simulation.setStatus.path, async (req, res) => {
    try {
      const input = api.simulation.setStatus.input.parse(req.body);
      const newStatus = await storage.setSimulationStatus(input.status);
      res.json({ success: true, status: newStatus });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Transaction History Endpoints
  // GET /api/transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      res.json({ success: true, transactions: allTransactions });
    } catch (err) {
      console.error("❌ Failed to fetch transactions:", err);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // POST /api/transactions (called immediately after creating via UI)
  app.post("/api/transactions", async (req, res) => {
    try {
      const { transactionId, walletAddress, amount, gasFee } = req.body;
      if (!transactionId || !walletAddress || !amount || !gasFee) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const newTx = await db.insert(transactions).values({
        transactionId,
        walletAddress,
        amount,
        gasFee,
        status: "pending",
        createdAt: new Date(),
      }).returning();
      
      res.json({ success: true, transaction: newTx[0] });
    } catch (err) {
      console.error("❌ Failed to save transaction:", err);
      res.status(500).json({ message: "Failed to save transaction record" });
    }
  });

  // Verification endpoint representing the Oracle/Backend confirmation
  app.post(api.simulation.verify.path, async (req, res) => {
    try {
      const currentStatus = await storage.getSimulationStatus();

      // Simulate a small network delay for realism
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (currentStatus === "success") {
        // Get transaction ID from request
        const { transactionId } = req.body;
        console.log(
          "🔄 Processing finalization for transaction:",
          transactionId,
        );

        if (!transactionId) {
          console.log("❌ No transaction ID provided");
          return res.status(400).json({ message: "Transaction ID required" });
        }

        // Connect to Ganache and use the contract owner signer for finalization
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await getOwnerSigner(provider);

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ATOMIC_ESCROW_ABI,
          signer,
        );

        try {
          console.log("📞 Calling contract.finalizeTransaction()...");
          const tx = await contract.finalizeTransaction(transactionId);
          console.log("⏳ Waiting for transaction confirmation...");
          const receipt = await tx.wait();
          console.log("✅ Transaction finalized successfully:", tx.hash);
          console.log("📋 Receipt:", receipt);
          
          try {
            // Update db status to success
            await db.update(transactions)
              .set({ status: "success" })
              .where(eq(transactions.transactionId, transactionId));
          } catch (dbErr) {
            console.error("❌ DB update failed:", dbErr);
          }
        } catch (contractError) {
          console.error("❌ Contract finalization error:", contractError);
          return res
            .status(500)
            .json({ message: "Failed to finalize transaction on blockchain" });
        }

        return res.json({
          status: "success",
          message: "Service Confirmed. Funds Released.",
        });
      } else if (currentStatus === "error") {
        // Get transaction ID from request
        const { transactionId } = req.body;
        console.log("🔄 Processing refund for transaction:", transactionId);

        if (!transactionId) {
          console.log("❌ No transaction ID provided");
          return res.status(400).json({ message: "Transaction ID required" });
        }

        // Connect to Ganache and use the contract owner signer for refunding
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = await getOwnerSigner(provider);

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ATOMIC_ESCROW_ABI,
          signer,
        );

        try {
          console.log("📞 Calling contract.refundUser()...");
          console.log("🔑 Using signer address:", await signer.getAddress());
          console.log("📋 Contract address:", CONTRACT_ADDRESS);
          console.log("🆔 Transaction ID:", transactionId);

          // Check if transaction exists first
          try {
            const txData = await contract.transactions(transactionId);
            console.log("📊 Transaction data:", {
              user: txData[0],
              merchant: txData[1],
              amount: ethers.formatEther(txData[2]),
              timestamp: txData[3].toString(),
              status: txData[4].toString(),
              isLocked: txData[5],
            });
          } catch (readError) {
            console.log("❌ Could not read transaction data:", readError);
          }

          const tx = await contract.refundUser(transactionId);
          console.log("⏳ Waiting for transaction confirmation...");
          const receipt = await tx.wait();
          console.log("✅ Transaction refunded successfully:", tx.hash);
          console.log("📋 Receipt:", receipt);
          
          try {
             // Update db status to error/refunded
             await db.update(transactions)
               .set({ status: "error" })
               .where(eq(transactions.transactionId, transactionId));
          } catch (dbErr) {
             console.error("❌ DB update failed:", dbErr);
          }
        } catch (contractError: any) {
          console.error("❌ Contract refund error:", contractError);
          console.error("❌ Error message:", contractError.message);
          console.error("❌ Error data:", contractError.data);
          console.error("❌ Error code:", contractError.code);

          // Try to get more details about the transaction
          try {
            const txData = await contract.transactions(transactionId);
            console.log("📊 Transaction state after error:", {
              user: txData[0],
              merchant: txData[1],
              amount: ethers.formatEther(txData[2]),
              timestamp: txData[3].toString(),
              status: txData[4].toString(),
              isLocked: txData[5],
            });
          } catch (readError) {
            console.log(
              "❌ Could not read transaction data after error:",
              readError,
            );
          }

          return res.status(500).json({
            message: "Failed to refund transaction on blockchain",
            error: contractError.message,
            details: contractError.data || contractError.toString(),
          });
        }

        return res.status(200).json({
          status: "error",
          message: "Verification failed. Funds refunded automatically.",
        });
      }

      res.json({ status: "success", message: "Service Confirmed." });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
