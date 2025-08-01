# 1Shot API Gas Station

The 1Shot API Gas Station contract is meant to be used with an [x402](https://x402.org) relayer gateway to allow users to swap ERC-20 tokens for native gas tokens when they don't have any funds to pay for transaction fees. 

The Gas Station contract uses [Li.Fi](https://li.fi/) to perform swaps, and is designed to roughly mimic how the [Permit2Proxy](https://github.com/lifinance/contracts/blob/main/src/Periphery/Permit2Proxy.sol) contract works in the Li.Fi periphery. 

## Gas Station Details

The [GasStation1Shot.sol](/contracts/GasStation1Shot.sol) contract can only be used with ERC-20 tokens that are [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) compatible, (like [USDC](https://github.com/FraxFinance/fraxtal-usdc) and USDT) and it is intended only to swap a users tokens into native coins. 

There are three checks performed internally:

1. The function signature on the `diamondCalldata` is ensured to correspond to one of the Li.Fi functions which swap to native coins (the swap is guaranteed to produce native coins).
2. The recipient of the native tokens is ensured to be the same address as the address which signed the EIP-3009 authorization (the authorizor is guaranteed to be the recipient of the output of the swap).
3. All funds authorized to be swapped by the user are ensured to be swapped (i.e. the relayer cannot input `diamondCalldata` that will leave residual tokens in the Gas Station after the transaction). 

The slippage and fee data is set by the person/relayer who submits the transaction and is not guaranteed for the end user since this would require a second signature for the user to sign. The intention is that this Gas Station swap contract would only be used to procure small amounts of native token, so there is low risk to the user to lose substantial funds. 

## Hardhat Cheatsheet 
Try running some of the following tasks:

```shell
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set PRIVATE_KEY
npx hardhat vars set ETHERSCAN_API_KEY
npx hardhat ignition deploy ./ignition/modules/TestnetDeploy.ts --network <testnetwork>
npx hardhat ignition verify chain-<chainId> --include-unrelated-contracts
```

## Deployments: 

Base - [0x17ed2c50596e1c74175f905918ded2d2042b87f3](https://basescan.org/address/0x17ed2c50596e1c74175f905918ded2d2042b87f3)