import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const INFURA_API_KEY = vars.has("INFURA_API_KEY") ? [vars.get("INFURA_API_KEY")] : [];
const PRIVATE_KEY = vars.has("PRIVATE_KEY") ? [vars.get("PRIVATE_KEY")] : ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"];
const ETHERSCAN_API_KEY = vars.has("ETHERSCAN_API_KEY") ? [vars.get("ETHERSCAN_API_KEY")] : [];
const BASESCAN_API_KEY = vars.has("BASESCAN_API_KEY") ? [vars.get("BASESCAN_API_KEY")] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 5000
      }
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    },
    fuji: {
      url: `https://avalanche-fuji.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    },
    base: {
      url: `https://base-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: {
      sepolia: `${ETHERSCAN_API_KEY}`,
      base: `${BASESCAN_API_KEY}`,
    },
  },
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log("Address: ", account.address, " Balance: ", await hre.ethers.provider.getBalance(account.address));
  }
});

export default config;
