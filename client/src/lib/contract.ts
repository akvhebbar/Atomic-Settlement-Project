import { ethers } from "ethers";

// Contract address deployed on Ganache
// Successfully deployed to this address
export const CONTRACT_ADDRESS = "0x7D28F8dd50E15543232829eD24aEeD98D2834a67";

// Merchant address (Ganache account #0 - deployer)
// Your main Ganache account
export const MERCHANT_ADDRESS = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";

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
