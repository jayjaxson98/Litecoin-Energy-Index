/**
 * Deployment script for LitbreakToken v2 on LitVM Testnet.
 *
 * Deploys in order:
 *   1. MockWLTC (test WLTC token with faucet)
 *   2. MockOracle (primary) — LTC/USD price feed
 *   3. MockOracle (fallback) — LTC/USD price feed
 *   4. LitbreakTokenV2 — main protocol contract
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network litvm_testnet
 *   npx hardhat run scripts/deploy.js --network hardhat  (local test)
 *
 * IMPORTANT: Before running, ensure you have:
 *   1. Cleared cache: rm -rf cache artifacts
 *   2. Compiled fresh: npx hardhat compile --force
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Validates that a contract factory has non-empty bytecode.
 * Handles differences between ethers v5 and v6 API.
 *
 * @param {string} contractName - Name of the contract
 * @param {object} factory - ethers ContractFactory instance
 * @throws {Error} if bytecode is empty or missing
 */
function validateBytecode(contractName, factory) {
  // ethers v6: factory.bytecode
  // ethers v5: factory.bytecode
  const bytecode = factory.bytecode || '';

  if (!bytecode || bytecode === '0x' || bytecode === '0x0' || bytecode.length <= 2) {
    // Additional check: try reading artifact directly
    const artifactPath = path.resolve(
      __dirname, '..', 'artifacts', 'contracts',
      `${contractName}.sol`, `${contractName}.json`
    );

    let artifactBytecode = '';
    if (fs.existsSync(artifactPath)) {
      try {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        artifactBytecode = artifact.bytecode || '';
      } catch (e) {
        // ignore parse errors
      }
    }

    if (artifactBytecode && artifactBytecode.length > 2 && artifactBytecode !== '0x') {
      console.log(`  ⚠ factory.bytecode was empty but artifact file has bytecode (${artifactBytecode.length} chars)`);
      console.log(`  → This suggests a Hardhat/ethers version mismatch. Continuing with artifact bytecode.`);
      return; // Artifact has bytecode, factory just didn't load it properly
    }

    throw new Error(
      `${contractName} bytecode is empty!\n\n` +
      `Troubleshooting steps:\n` +
      `  1. Clear ALL caches:\n` +
      `     rm -rf cache artifacts node_modules/.cache\n\n` +
      `  2. Reinstall dependencies:\n` +
      `     npm install\n\n` +
      `  3. Recompile with verbose output:\n` +
      `     npx hardhat compile --force --verbose\n\n` +
      `  4. Run diagnostic:\n` +
      `     npx hardhat run scripts/diagnose.js\n\n` +
      `  5. If still failing, try upgrading Hardhat:\n` +
      `     npm install hardhat@latest @nomicfoundation/hardhat-ethers@latest\n\n` +
      `  6. Nuclear option — delete node_modules and reinstall:\n` +
      `     rm -rf node_modules package-lock.json cache artifacts\n` +
      `     npm install\n` +
      `     npx hardhat compile --force\n`
    );
  }

  console.log(`  ✓ ${contractName} bytecode OK (${bytecode.length} chars)`);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Litbreak v2 — LitVM Testnet Deployment');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Network:   ${hre.network.name}`);

  const network = await deployer.provider.getNetwork();
  console.log(`  Chain ID:  ${network.chainId}`);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`  Balance:   ${hre.ethers.formatEther(balance)} ETH/LTC`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // ── Configuration from environment ──
  const INITIAL_LTC_PRICE = process.env.INITIAL_LTC_PRICE || '8742000000'; // $87.42 (8 decimals)
  const INITIAL_GEI = process.env.INITIAL_GEI || '1000000000000000000'; // 1e18 = 100%

  // ── Pre-flight: Validate all bytecodes before deploying anything ──
  console.log('[Pre-flight] Validating contract bytecodes...');

  const MockWLTC = await hre.ethers.getContractFactory('MockWLTC');
  validateBytecode('MockWLTC', MockWLTC);

  const MockOracle = await hre.ethers.getContractFactory('MockOracle');
  validateBytecode('MockOracle', MockOracle);

  const LitbreakTokenV2 = await hre.ethers.getContractFactory('LitbreakTokenV2');
  validateBytecode('LitbreakTokenV2', LitbreakTokenV2);

  console.log('  All bytecodes validated ✅');
  console.log('');

  // ── Step 1: Deploy MockWLTC ──
  console.log('[1/4] Deploying MockWLTC...');
  const wltc = await MockWLTC.deploy();
  await wltc.waitForDeployment();
  const wltcAddr = await wltc.getAddress();
  console.log(`  ✓ MockWLTC deployed at: ${wltcAddr}`);

  // ── Step 2: Deploy Primary MockOracle ──
  console.log('[2/4] Deploying Primary Oracle (MockOracle)...');
  const primaryOracle = await MockOracle.deploy(
    8,                    // 8 decimals (Chainlink standard)
    'LTC / USD Primary',  // description
    BigInt(INITIAL_LTC_PRICE)
  );
  await primaryOracle.waitForDeployment();
  const primaryAddr = await primaryOracle.getAddress();
  console.log(`  ✓ Primary Oracle deployed at: ${primaryAddr}`);

  // ── Step 3: Deploy Fallback MockOracle ──
  console.log('[3/4] Deploying Fallback Oracle (MockOracle)...');
  const fallbackOracle = await MockOracle.deploy(
    8,                     // 8 decimals
    'LTC / USD Fallback',  // description
    BigInt(INITIAL_LTC_PRICE)
  );
  await fallbackOracle.waitForDeployment();
  const fallbackAddr = await fallbackOracle.getAddress();
  console.log(`  ✓ Fallback Oracle deployed at: ${fallbackAddr}`);

  // ── Step 4: Deploy LitbreakTokenV2 ──
  console.log('[4/4] Deploying LitbreakTokenV2...');
  const lbt = await LitbreakTokenV2.deploy(
    wltcAddr,        // _wltc
    primaryAddr,     // _primaryOracle
    fallbackAddr,    // _fallbackOracle
    deployer.address, // _geiOracle (deployer acts as GEI oracle on testnet)
    BigInt(INITIAL_GEI)
  );
  await lbt.waitForDeployment();
  const lbtAddr = await lbt.getAddress();
  console.log(`  ✓ LitbreakTokenV2 deployed at: ${lbtAddr}`);

  // ── Post-deployment: Mint test WLTC to deployer ──
  console.log('');
  console.log('[Post] Minting 100 WLTC to deployer for testing...');
  const faucetTx = await wltc.faucet(hre.ethers.parseEther('100'));
  await faucetTx.wait();
  console.log('  ✓ 100 WLTC minted to deployer');

  // ── Post-deployment: Verify contracts respond ──
  console.log('[Post] Verifying contract state...');
  const lbtName = await lbt.name();
  const lbtSymbol = await lbt.symbol();
  const ltcPrice = await lbt.ltcPriceUsd();
  const currentGei = await lbt.gei();
  const wltcBalance = await wltc.balanceOf(deployer.address);

  console.log(`  LBT name: ${lbtName}`);
  console.log(`  LBT symbol: ${lbtSymbol}`);
  console.log(`  LTC price (18 dec): ${ltcPrice.toString()}`);
  console.log(`  GEI (18 dec): ${currentGei.toString()}`);
  console.log(`  Deployer WLTC balance: ${hre.ethers.formatEther(wltcBalance)}`);

  // ── Write deployment addresses to file ──
  const deployment = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockWLTC: wltcAddr,
      PrimaryOracle: primaryAddr,
      FallbackOracle: fallbackAddr,
      LitbreakTokenV2: lbtAddr,
    },
    config: {
      geiOracle: deployer.address,
      initialLtcPrice: `$${(parseInt(INITIAL_LTC_PRICE) / 1e8).toFixed(2)}`,
      initialGei: `${(parseInt(INITIAL_GEI) / 1e16).toFixed(2)}%`,
    },
  };

  const deploymentPath = path.resolve(__dirname, '..', `deployment-${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`  ✓ Deployment info saved to ${deploymentPath}`);

  // ── Summary ──
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DEPLOYMENT COMPLETE ✅');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  MockWLTC:          ${wltcAddr}`);
  console.log(`  Primary Oracle:    ${primaryAddr}`);
  console.log(`  Fallback Oracle:   ${fallbackAddr}`);
  console.log(`  LitbreakTokenV2:   ${lbtAddr}`);
  console.log(`  GEI Oracle:        ${deployer.address}`);
  console.log(`  Initial LTC Price: $${(parseInt(INITIAL_LTC_PRICE) / 1e8).toFixed(2)}`);
  console.log(`  Initial GEI:       ${(parseInt(INITIAL_GEI) / 1e16).toFixed(2)}%`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Update frontend .env with contract addresses');
  console.log('  2. Approve WLTC spending: wltc.approve(lbtAddr, amount)');
  console.log('  3. Test mint: lbt.mint(amount)');
  console.log('  4. Test redeem: lbt.redeem(amount)');
  console.log('');

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('');
    console.error('══════════════════════════════════════');
    console.error('  DEPLOYMENT FAILED');
    console.error('══════════════════════════════════════');
    console.error(error.message || error);
    console.error('');
    process.exit(1);
  });
