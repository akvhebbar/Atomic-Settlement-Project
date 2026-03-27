# MetaMask + Ganache Setup Guide

## ✅ What Was Done

Your project has been fully configured to work with MetaMask and Ganache:

### 1. **Smart Contract Deployed** ✅

- **Contract:** AtomicEscrow
- **Address:** `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
- **Network:** Ganache (ChainID: 1337)
- **RPC URL:** `http://127.0.0.1:7545`

### 2. **Frontend Web3 Integration** ✅

Created/Updated files:

- `client/src/lib/web3.ts` - Web3 connection utilities
- `client/src/lib/contract.ts` - Contract configuration
- `client/src/hooks/use-metamask.tsx` - MetaMask connection hook
- `client/src/components/layout/Navbar.tsx` - Updated wallet connection UI
- `client/src/App.tsx` - Added wallet initialization
- `client/src/store/use-store.ts` - Real wallet state management

### 3. **Ganache is Running**

- **Port:** 7545
- **Status:** Active and ready
- **Accounts:** 10 pre-generated accounts with 1000 ETH each

---

## 🚀 Next Steps to Get Running

### Step 1: Configure MetaMask

1. Open MetaMask extension
2. Click the network dropdown (top-right)
3. Click "Add Network" → "Add network manually"
4. Enter these details:

```
Network Name: Ganache
New RPC URL: http://127.0.0.1:7545
Chain ID: 1337
Currency Symbol: ETH
Block Explorer URL: (leave blank)
```

5. Click "Save"
6. You'll automatically be switched to Ganache network

### Step 2: Import Ganache Account to MetaMask

1. In MetaMask, click your account icon (top-right)
2. Click "Import Account"
3. Enter this private key:

```
0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
```

**Note:** This is the account that deployed your contract and will be used for transactions.

### Step 3: Run Your Application

```bash
# Terminal 1: Ganache is already running on port 7545

# Terminal 2: Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔗 Connection Flow

```
MetaMask Wallet
    ↓
Ganache Network (port 7545)
    ↓
Smart Contract (0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab)
```

---

## 📝 Important Configuration Values

```typescript
// These are now in client/src/lib/contract.ts

CONTRACT_ADDRESS = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";
MERCHANT_ADDRESS = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1";
```

---

## ✨ Features Enabled

✅ Real MetaMask wallet connection  
✅ Automatic Ganache network switching  
✅ Account switching detection  
✅ Network change detection  
✅ Real smart contract interaction  
✅ Error handling and user feedback

---

## 🐛 Troubleshooting

### MetaMask not connecting?

- Make sure Ganache terminal is still running (check `Test success!`)
- Reload the page (Ctrl+F5 or Cmd+Shift+R)
- Check if MetaMask extension is unlocked

### "Contract not found" error?

- Contract address: `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
- Double-check it matches in `client/src/lib/contract.ts`

### Ganache is not running?

Run in a new terminal:

```bash
npm run ganache
```

### Port 7545 already in use?

```bash
# Kill existing processes
npm run ganache  # This will handle it automatically
```

---

## 📚 Files Reference

- **Web3 Utilities:** `client/src/lib/web3.ts`
- **Contract Config:** `client/src/lib/contract.ts`
- **Wallet Hook:** `client/src/hooks/use-metamask.tsx`
- **App Setup:** `client/src/App.tsx`
- **UI Component:** `client/src/components/layout/Navbar.tsx`
- **Deploy Script:** `scripts/deploy.ts`
- **Hardhat Config:** `hardhat.config.ts`
