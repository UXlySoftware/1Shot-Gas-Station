# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set PRIVATE_KEY
npx hardhat vars set ETHERSCAN_API_KEY
npx hardhat ignition deploy ./ignition/modules/TestnetDeploy.ts --network <testnetwork>
npx hardhat ignition verify chain-<chainId> --include-unrelated-contracts
```

FraxFinance EIP-3009 implementation: https://github.com/FraxFinance/fraxtal-usdc

## Deployments: 

Base - [0x17ed2c50596e1c74175f905918ded2d2042b87f3](https://basescan.org/address/0x17ed2c50596e1c74175f905918ded2d2042b87f3)