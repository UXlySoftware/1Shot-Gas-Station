import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const { randomBytes } = require("crypto");

const INFURA_API_KEY = vars.has("INFURA_API_KEY")
  ? [vars.get("INFURA_API_KEY")]
  : [];
const PRIVATE_KEY = vars.has("PRIVATE_KEY")
  ? [vars.get("PRIVATE_KEY")]
  : ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"];
const ETHERSCAN_API_KEY = vars.has("ETHERSCAN_API_KEY")
  ? [vars.get("ETHERSCAN_API_KEY")]
  : [];
const BASESCAN_API_KEY = vars.has("BASESCAN_API_KEY")
  ? [vars.get("BASESCAN_API_KEY")]
  : [];

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 5000,
      },
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
    },
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
    console.log(
      "Address: ",
      account.address,
      " Balance: ",
      await hre.ethers.provider.getBalance(account.address)
    );
  }
});

task("x402-gas-station", "hit the gas station URL with an x402 payload")
  .addParam("amount", "The amount of tokens to send")
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const tokenAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC on Base
    const amount = taskArgs.amount;
    const to = "0xD9699942281A00188707d3244c9Cb827DE0e4A3c";
    const now = Math.floor(Date.now() / 1000);
    const validAfter = now;
    const validBefore = now + 90;
    const nonce = "0x" + randomBytes(32).toString("hex");

    const data = {
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      domain: {
        name: "USD Coin",
        version: "2",
        chainId: 8453,
        verifyingContract: tokenAddress,
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from: signer.address,
        to: to,
        value: amount,
        validAfter: validAfter,
        validBefore: validBefore,
        nonce: nonce,
      },
    };

    const signature = await signer.signTypedData(
      data.domain,
      data.types,
      data.message
    );

    const xPaymentObject = {
      from: signer.address,
      to: to,
      value: amount,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce,
      signature: signature,
    };

    const jsonString = JSON.stringify(xPaymentObject);
    const base64Encoded = Buffer.from(jsonString, "utf-8").toString("base64");
    console.log("Base64 Encoded Payload:", base64Encoded);
  });

export default config;
