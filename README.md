# ⚡ Atomic Settlement Platform

A complete implementation of an atomic settlement escrow platform running on a local Ethereum network (Ganache). This project provides a fully functional end-to-end integration with real smart contract locking, real-time gas calculations, dynamic wallet interactions without relying on mock data, and a futuristic user interface.

## 🚀 Key Features

* **Real MetaMask Integration:** Custom wallet connection hooking using real Web3 providers.
* **Smart Contract Fund Locking:** Actual `depositFunds()`, `finalizeTransaction()`, and `refundUser()` interactions on the local blockchain.
* **Real-time Gas Estimation:** Calculates cost based on dynamic network conditions and updates automatically.
* **Auto Sync Wallet Balance:** Live wallet polling directly from Ganache that captures transaction and refund updates.
* **Automated Safety:** Transactions waiting in escrow auto-refund after 60 seconds if not processed. 

---

## 🛠 Tech Stack & Requirements

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS & Shadcn UI
- **State Management:** Zustand (for wallet and transaction flow)
- **Web3 Setup:** `viem` & direct MetaMask API calls
- **UI Notifications:** Sonner (for premium toast blockchain events)
- **Icons:** Lucide React

### Backend / Smart Contracts
- **Framework:** Hardhat 
- **Language:** Solidity
- **Network:** Ganache (Local RPC on `http://127.0.0.1:7545`)

*Note: Dynamic images were intentionally excluded to focus on a sleek, CSS-driven futuristic aesthetic relying on structural design.*

---

## 🔐 Smart Contract Architecture

The core of the system is the `AtomicEscrow` smart contract.

* **Contract Address:** `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
* **Network / Chain ID:** Ganache / `1337`

### Execution Flow:
1. **Deposit:** `depositFunds(_merchant, _transactionId)` locks the ETH in the contract (`isLocked: true`).
2. **Hold:** Funds sit in the contract's balance to ensure an atomic, trustless escrow.
3. **Resolve:** 
   - `finalizeTransaction(_transactionId)` releases the locked ETH to the merchant.
   - `refundUser(_transactionId)` releases the locked ETH back to the buyer.
4. **Safety Timeout:** Automatic refund capabilities are triggered if 60 seconds pass without action.

---

## 🏁 Quick Start & Setup Guide

### Step 1: Start the Local Network

Your smart contract should be deployed and Ganache should be running. Let's make sure things are running:

```bash
# Terminal 1: Spin up the Ganache Node
npm run ganache

# Terminal 2: Run the frontend application
npm run dev
```
The web app will run successfully at `http://localhost:5173`. 

### Step 2: Configure MetaMask

Because this project runs actual smart contracts, you need real MetaMask configured pointing to your local Ganache:

1. Open your **MetaMask Extension**
2. Click the network dropdown (top-left/right) → **Add network manually**
   * **Network Name:** `Ganache`
   * **New RPC URL:** `http://127.0.0.1:7545`
   * **Chain ID:** `1337`
   * **Currency Symbol:** `ETH`
3. Hit **Save**.

### Step 3: Import Ganache Account to MetaMask

You must import an account fueled by Ganache to interact with the platform.
1. Click your account icon in MetaMask → **Import Account**
2. Enter the private key of the deploying account:
   ```text
   0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
   ```
3. You now have the test account loaded with ETH.

---

## 🎬 Using the Application

### 1. Connect Wallet
Navigate to `http://localhost:5173`. Click the **Connect Wallet** button. MetaMask will issue a prompt and automatically direct you to the Ganache network if properly set up. You will see your account loaded with exactly the balance on the blockchain. Let things hang for 3 seconds; a heartbeat verifies your wallet's live balance.

### 2. Initiate Payment
The app validates if you have the proper required funds:
`0.05 ETH (Base Payment)` + `Calculated network gas`. 
Once validated, review the dynamically calculated payment and confirm.

### 3. Smart Contract Verification
Click **Pay Now & Lock Funds**. MetaMask will prompt a transaction approval. Wait a few seconds for the contract to finalize. 
* The transaction broadcasts to Ganache.
* The funds move directly into the contract balance (`isLocked`).
* Transaction hash executes properly, the UI picks up the success state, and releases/refunds logic resolves accordingly.

---

## 🔧 Useful Commands

```bash
# Start Ganache (if not running)
npm run ganache

# Start development server
npm run dev

# Compile Smart Contracts
npx hardhat compile

# Deploy Smart Contract manually to Ganache
npx hardhat run scripts/deploy.ts --network ganache

# Type verification
npm run check
```

## 🐛 Troubleshooting

* **Connect MetaMask isn't working:** Ensure the extension is unlocked, Ganache is actively running, and you refreshed the browser.
* **Insufficient Balance:** You might be connected to an arbitrary account. Ensure you imported the specific Ganache Private Key.
* **Transaction Failed:** Ensure MetaMask explicitly shows Network ChainID `1337`. If you previously restarted Ganache, reset your MetaMask account data (Settings > Advanced > Clear activity tab data).