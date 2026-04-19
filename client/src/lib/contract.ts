import { ethers } from "ethers";

// Contract address deployed on Ganache
// Successfully deployed to this address
export const CONTRACT_ADDRESS = "0x3303dbb9158a9d00CD92f38a9123F8798A65881D";

// Merchant address (Ganache account #1)
// Your secondary Ganache account for testing receipts
export const MERCHANT_ADDRESS = "0x94dE8cd7351ec7275ee2A4A324c7E9B5Fa43290A";

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
