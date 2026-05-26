import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
dotenv.config();

const config = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'paris', // LitVM does not support PUSH0 (Shanghai+)
    },
  },
  networks: {
    'litvm-testnet': {
      url:      process.env.LITVM_TESTNET_RPC ?? 'https://rpc.litvm-testnet.io',
      chainId:  1856,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 100_000_000, // 0.1 gwei
    },
    'litvm-mainnet': {
      url:      process.env.LITVM_MAINNET_RPC ?? 'https://rpc.litvm.io',
      chainId:  1857,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 100_000_000,
    },
  },
  paths: {
    sources:   './contracts',
    tests:     './test',
    cache:     './cache',
    artifacts: './artifacts',
  },
};

export default config;
