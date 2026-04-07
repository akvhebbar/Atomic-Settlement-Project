import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { ethers } from "ethers";

// Contract details
const CONTRACT_ADDRESS = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";
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

        // Connect to Ganache and finalize the transaction
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = new ethers.Wallet(
          "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d", // Ganache default private key
          provider,
        );

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

        // Connect to Ganache and refund the transaction
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const signer = new ethers.Wallet(
          "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d", // Ganache default private key
          provider,
        );

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

        return res
          .status(200)
          .json({
            status: "error",
            message: "Verification failed. Funds refunded automatically.",
          });
      } else if (currentStatus === "timeout") {
        // Simulate a timeout that takes a long time and then fails
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return res
          .status(500)
          .json({
            message: "Timeout/Error Detected. Instant Refund Executed.",
          });
      }

      res.json({ status: "success", message: "Service Confirmed." });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
