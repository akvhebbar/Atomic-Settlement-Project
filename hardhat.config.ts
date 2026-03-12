// load ethers toolbox so that `hre.ethers` and related helpers are available
console.log("hardhat.config.ts loaded");
import "@nomicfoundation/hardhat-ethers";
// import "@nomicfoundation/hardhat-toolbox-viem"; // omitted to avoid gas-reporter dependency
import { configVariable, defineConfig } from "hardhat/config";

import { task } from "hardhat/config";

// debug task to print the ethers object
task("check-ethers", "Print hre.ethers").setAction(async (_, hre) => {
  console.log("hre.ethers =", hre.ethers);
});

export default defineConfig({
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
});
