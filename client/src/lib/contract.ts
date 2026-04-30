import { ethers } from "ethers";

// Contract address deployed on Ganache
// Successfully deployed to this address
export const CONTRACT_ADDRESS = "0x6BC073124F1f14fFB40F6a8080cf33b157305C94";

// Merchant address (Ganache account #1)
// Your secondary Ganache account for testing receipts
export const MERCHANT_ADDRESS = "0x5bc79e0AE4877127d3BB5bc543ebD0DA95C462B3";

// Payment amount (0.05 ETH)
export const PAYMENT_AMOUNT = ethers.parseEther("0.05");

// Atomic Escrow Contract ABI
export const ATOMIC_ESCROW_ABI = [
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
        name: "_transactionId",
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
];

// Get contract instance
export const getContract = (
  signer: ethers.Signer | ethers.Provider,
): ethers.Contract => {
  return new ethers.Contract(CONTRACT_ADDRESS, ATOMIC_ESCROW_ABI, signer);
};

// Transaction status enum
export enum TransactionStatus {
  PENDING = 0,
  COMPLETED = 1,
  REFUNDED = 2,
  CANCELLED = 3,
}

// Helper to format transaction ID
export const formatTxId = (txId: string | number): string => {
  return ethers.toUtf8String(ethers.zeroPadValue(ethers.toBeHex(txId), 32));
};

// Helper to encode transaction ID
export const encodeTxId = (txId: string): string => {
  return ethers.encodeBytes32String(txId);
};
