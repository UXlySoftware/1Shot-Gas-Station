import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
const { randomBytes } = require("crypto");
import axios from "axios";

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
    basesepolia: {
      url: `https://base-sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${PRIVATE_KEY}`],
    }
  },
  etherscan: {
    apiKey: {
      sepolia: `${ETHERSCAN_API_KEY}`,
      base: `${BASESCAN_API_KEY}`,
      basesepolia: `${BASESCAN_API_KEY}`
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
  .addParam("tokenaddress", "The address of the token to send")
  .addParam("amount", "The amount of tokens to send")
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const latestBlock = await signer.provider.getBlock("latest");

    const chainId = await signer.provider.getNetwork().then((n) => n.chainId);
    const tokenAddress = taskArgs.tokenaddress;
    const amount = taskArgs.amount;
    const to = "0xA1BfEd6c6F1C3A516590edDAc7A8e359C2189A61"; // the to address is always the gas station address
    const now = latestBlock.timestamp;
    const validAfter = now;
    const validBefore = now + 90;
    const nonce = "0x" + randomBytes(32).toString("hex");

    const token = await hre.ethers.getContractAt(
      [
        "function name() view returns (string)",
        "function version() view returns (string)",
      ],
      tokenAddress,
      signer
    );

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
        name: await token.name(),
        version: await token.version(),
        chainId: chainId,
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
      ...data.message,
      signature: signature,
    };

    const jsonString = JSON.stringify(xPaymentObject);
    const base64Encoded = Buffer.from(jsonString, "utf-8").toString("base64");

    const body = {
      fromChain: chainId.toString(),
      fromToken: tokenAddress,
      fromAmount: amount.toString(),
      fromAddress: signer.address,
      toChain: "56",
      toToken: "0x0000000000000000000000000000000000000000", // we only ask for native
    };

    const url =
      "https://n8n.1shotapi.dev/webhook-test/92c5ca23-99a7-437d-85da-84aef8bd2a25";

    const response = await axios.post(url, body, {
      headers: {
        "x-payment": base64Encoded,
        "User-Agent": "CustomUserAgent/1.0",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);
    console.log("Response body:", response.data);
  });

task("x402-inference", "get inference over x402")
  .addParam("tokenaddress", "The address of the token to send")
  .addParam("amount", "The amount of tokens to send")
  .addParam("userquery", "The user query to send")
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    const signer = accounts[0];

    const latestBlock = await signer.provider.getBlock("latest");

    const chainId = await signer.provider.getNetwork().then((n) => n.chainId);
    const tokenAddress = taskArgs.tokenaddress;
    const amount = taskArgs.amount;
    const to = signer.address; // the to address is always the gas station address
    const now = latestBlock.timestamp;
    const validAfter = now;
    const validBefore = now + 90;
    const nonce = "0x" + randomBytes(32).toString("hex");
    const userQuery = taskArgs.userquery;

    const token = await hre.ethers.getContractAt(
      [
        "function name() view returns (string)",
        "function version() view returns (string)",
      ],
      tokenAddress,
      signer
    );

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
        name: await token.name(),
        version: await token.version(),
        chainId: chainId,
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
      ...data.message,
      signature: signature,
    };

    const jsonString = JSON.stringify(xPaymentObject);
    const base64Encoded = Buffer.from(jsonString, "utf-8").toString("base64");

    const body = {
      query: userQuery
    };

    const url =
      "https://n8n.1shotapi.dev/webhook-test/92c5ca23-99a7-437d-85da-84aef8bd2a25";

    const response = await axios.post(url, body, {
      headers: {
        "x-payment": base64Encoded,
        "User-Agent": "CustomUserAgent/1.0",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);
    console.log("Response body:", response.data);
  });

export default config;
