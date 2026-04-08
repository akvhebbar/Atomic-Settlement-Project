import "@nomicfoundation/hardhat-ethers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "paris",
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
  networks: {
    ganache: {
      type: "http" as any,
      url: "http://127.0.0.1:7545",
    },
    localhost: {
      type: "http" as any,
      url: "http://127.0.0.1:8545",
    },
  },
});
