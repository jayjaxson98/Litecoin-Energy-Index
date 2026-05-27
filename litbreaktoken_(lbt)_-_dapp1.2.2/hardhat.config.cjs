/**
 * Hardhat configuration for LitbreakToken v2
 * Targets LitVM testnet for deployment and verification.
 *
 * NOTE: This config uses CommonJS (.cjs) for compatibility with
 * the project's ESM package.json ("type": "module").
 *
 * Solidity version set to 0.8.30 to match the user's local compiler.
 * Contracts use pragma ^0.8.20 so they compile with 0.8.20 through 0.8.x.
 *
 * IMPORTANT: Do NOT set outputSelection manually — Hardhat manages this
 * internally and custom outputSelection can conflict with its artifact
 * generation pipeline, resulting in "compilation succeeded but no bytecode".
 */

require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.30',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      // Use 'paris' for maximum EVM compatibility (no PUSH0 opcode).
      // Change to 'shanghai' if LitVM testnet supports EIP-3855.
      evmVersion: 'paris',
      // NOTE: outputSelection is intentionally omitted.
      // Hardhat injects its own outputSelection that includes abi + bytecode.
      // Setting it manually can override Hardhat's internal requirements
      // and cause empty bytecode in generated artifacts.
    },
  },

  networks: {
    // Local development
    hardhat: {
      chainId: 31337,
    },

    // LitVM Testnet
    litvm_testnet: {
      url: process.env.LITVM_TESTNET_RPC_URL || 'https://testnet-rpc.litvm.net',
      chainId: parseInt(process.env.LITVM_CHAIN_ID || '1001'),
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: 'auto',
      gas: 8000000,
    },
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};
