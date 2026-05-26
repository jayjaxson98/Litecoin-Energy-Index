/**
 * Dappit Deployment Script for LitbreakProtocol on LitVM Testnet
 *
 * Environment Variables Required:
 *   LITVM_RPC_URL       - LitVM Testnet RPC endpoint (default: https://rpc.litvm-testnet.io)
 *   DEPLOYER_PRIVATE_KEY - Private key of the deployer account
 *   WLTC_ADDRESS         - Address of the wrapped LTC token on LitVM
 *   LTC_USD_FEED         - Chainlink LTC/USD price feed address on LitVM
 *   ENERGY_INDEX_FEED    - Chainlink energy index feed address on LitVM
 *   FEE_RECIPIENT        - Address to receive protocol fees
 *   INITIAL_MINING_EFF   - Initial mining efficiency in J/MH scaled x1e8 (default: 11230000)
 *
 * Usage:
 *   node scripts/deploy.js
 *
 * Verification (after deployment):
 *   npx hardhat verify --network litvm-testnet <CONTRACT_ADDRESS> \
 *     <WLTC_ADDRESS> <LTC_USD_FEED> <ENERGY_INDEX_FEED> <FEE_RECIPIENT> <INITIAL_MINING_EFF>
 */

const { ethers } = require('ethers');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Litbreak Energy Protocol — LitbreakProtocol Deploy    ║');
  console.log('║   Target: LitVM Testnet (Chain ID: 421611)              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Configuration ──────────────────────────────────────────────────
  const RPC_URL = process.env.LITVM_RPC_URL || 'https://rpc.litvm-testnet.io';
  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY environment variable is required');
    process.exit(1);
  }

  const WLTC_ADDRESS = process.env.WLTC_ADDRESS;
  const LTC_USD_FEED = process.env.LTC_USD_FEED;
  const ENERGY_INDEX_FEED = process.env.ENERGY_INDEX_FEED;
  const FEE_RECIPIENT = process.env.FEE_RECIPIENT;
  const INITIAL_MINING_EFF = process.env.INITIAL_MINING_EFF || '11230000';

  if (!WLTC_ADDRESS || !LTC_USD_FEED || !ENERGY_INDEX_FEED || !FEE_RECIPIENT) {
    console.error('❌ Missing required environment variables:');
    console.error('   WLTC_ADDRESS, LTC_USD_FEED, ENERGY_INDEX_FEED, FEE_RECIPIENT');
    process.exit(1);
  }

  console.log('📋 Deployment Configuration:');
  console.log(`   RPC URL:           ${RPC_URL}`);
  console.log(`   wLTC Address:      ${WLTC_ADDRESS}`);
  console.log(`   LTC/USD Feed:      ${LTC_USD_FEED}`);
  console.log(`   Energy Index Feed: ${ENERGY_INDEX_FEED}`);
  console.log(`   Fee Recipient:     ${FEE_RECIPIENT}`);
  console.log(`   Mining Efficiency: ${INITIAL_MINING_EFF}`);
  console.log('');

  // ── Connect to LitVM ──────────────────────────────────────────────
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const network = await provider.getNetwork();
  console.log(`🔗 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Deployer address: ${wallet.address}`);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} LTC`);
  console.log('');

  if (balance === 0n) {
    console.error('❌ Deployer has zero balance. Fund the account first.');
    process.exit(1);
  }

  // ── Deploy Contract ───────────────────────────────────────────────
  console.log('🚀 Deploying LitbreakProtocol...');
  console.log('');
  console.log('⚠️  This script demonstrates the deployment flow.');
  console.log('   For actual deployment, use Hardhat or Foundry:');
  console.log('');
  console.log('   # Using Hardhat:');
  console.log('   npx hardhat compile');
  console.log('   npx hardhat run scripts/deploy.js --network litvm-testnet');
  console.log('');
  console.log('   # Using Foundry:');
  console.log('   forge build');
  console.log('   forge create contracts/LitbreakProtocol.sol:LitbreakProtocol \\');
  console.log(`     --rpc-url ${RPC_URL} \\`);
  console.log('     --private-key $DEPLOYER_PRIVATE_KEY \\');
  console.log(`     --constructor-args ${WLTC_ADDRESS} ${LTC_USD_FEED} ${ENERGY_INDEX_FEED} ${FEE_RECIPIENT} ${INITIAL_MINING_EFF}`);
  console.log('');
  console.log('   # Verification:');
  console.log('   forge verify-contract <DEPLOYED_ADDRESS> contracts/LitbreakProtocol.sol:LitbreakProtocol \\');
  console.log(`     --chain-id ${network.chainId} \\`);
  console.log('     --constructor-args $(cast abi-encode "constructor(address,address,address,address,uint256)" \\');
  console.log(`       ${WLTC_ADDRESS} ${LTC_USD_FEED} ${ENERGY_INDEX_FEED} ${FEE_RECIPIENT} ${INITIAL_MINING_EFF})`);
  console.log('');

  // ── Post-Deployment Steps ─────────────────────────────────────────
  console.log('📝 Post-Deployment Checklist:');
  console.log('   1. Verify contract on LitVM Explorer');
  console.log('   2. Call updateEnergyIndex() with initial 30-country data');
  console.log('   3. Set oracle max staleness if different from 1 hour default');
  console.log('   4. Grant ORACLE_ROLE to automated oracle updater address');
  console.log('   5. Transfer DEFAULT_ADMIN_ROLE to multisig if applicable');
  console.log('   6. Update frontend contract address in ContractRegistry');
  console.log('');
  console.log('✅ Deployment script complete.');
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
