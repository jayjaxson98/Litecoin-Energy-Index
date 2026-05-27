/**
 * Diagnostic script for "Compilation succeeded but no bytecode" issue.
 * 
 * Run AFTER clearing cache:
 *   rm -rf cache artifacts
 *   npx hardhat compile --force
 *   npx hardhat run scripts/diagnose.js
 * 
 * This script checks:
 *   1. Whether artifact JSON files exist
 *   2. Whether bytecode fields are populated
 *   3. Whether getContractFactory returns valid bytecode
 *   4. Hardhat and solc version info
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Litbreak v2 — Compilation Diagnostic');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // ── 1. Environment Info ──
  console.log('[1] Environment');
  console.log(`  Hardhat version: ${hre.hardhatArguments ? 'detected' : 'unknown'}`);
  console.log(`  Network: ${hre.network.name}`);
  console.log(`  Solidity config version: ${hre.config.solidity.compilers ? hre.config.solidity.compilers[0].version : hre.config.solidity.version || 'unknown'}`);
  console.log('');

  // ── 2. Check contract source files ──
  console.log('[2] Contract Source Files');
  const contractDir = path.resolve(__dirname, '..', 'contracts');
  const expectedFiles = ['LitbreakTokenV2.sol', 'MockOracle.sol', 'MockWLTC.sol'];

  for (const file of expectedFiles) {
    const filePath = path.join(contractDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const size = content.length;
      // Check for actual contract declaration (not just interface/abstract)
      const hasContract = /^\s*contract\s+\w+/m.test(content);
      const hasAbstract = /^\s*abstract\s+contract/m.test(content);
      const hasInterface = /^\s*interface\s+\w+/m.test(content);
      const pragmaMatch = content.match(/pragma\s+solidity\s+([^;]+);/);
      const pragma = pragmaMatch ? pragmaMatch[1] : 'NOT FOUND';

      console.log(`  ${file}:`);
      console.log(`    Size: ${size} bytes`);
      console.log(`    Pragma: ${pragma}`);
      console.log(`    Has concrete contract: ${hasContract ? '✅ YES' : '❌ NO'}`);
      console.log(`    Has abstract contract: ${hasAbstract ? '⚠️  YES' : 'No'}`);
      console.log(`    Has interface: ${hasInterface ? 'Yes (OK if also has contract)' : 'No'}`);
    } else {
      console.log(`  ${file}: ❌ FILE NOT FOUND at ${filePath}`);
    }
  }
  console.log('');

  // ── 3. Check artifact JSON files ──
  console.log('[3] Artifact Files');
  const artifactPaths = [
    { name: 'MockWLTC', path: './artifacts/contracts/MockWLTC.sol/MockWLTC.json' },
    { name: 'MockOracle', path: './artifacts/contracts/MockOracle.sol/MockOracle.json' },
    { name: 'LitbreakTokenV2', path: './artifacts/contracts/LitbreakTokenV2.sol/LitbreakTokenV2.json' },
  ];

  for (const art of artifactPaths) {
    const fullPath = path.resolve(__dirname, '..', art.path);
    if (fs.existsSync(fullPath)) {
      const artifact = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const bytecodeLen = artifact.bytecode ? artifact.bytecode.length : 0;
      const deployedLen = artifact.deployedBytecode ? artifact.deployedBytecode.length : 0;
      const abiLen = artifact.abi ? artifact.abi.length : 0;

      console.log(`  ${art.name}:`);
      console.log(`    ABI entries: ${abiLen}`);
      console.log(`    Bytecode length: ${bytecodeLen} ${bytecodeLen > 2 ? '✅' : '❌ EMPTY (this is the problem!)'}`);
      console.log(`    DeployedBytecode length: ${deployedLen} ${deployedLen > 2 ? '✅' : '❌ EMPTY'}`);

      // Show first 20 chars of bytecode for debugging
      if (artifact.bytecode) {
        console.log(`    Bytecode preview: ${artifact.bytecode.substring(0, 40)}...`);
      }
    } else {
      console.log(`  ${art.name}: ❌ Artifact file not found at ${art.path}`);
      console.log(`    → Run: npx hardhat compile --force`);
    }
  }
  console.log('');

  // ── 4. Check via getContractFactory ──
  console.log('[4] ContractFactory Bytecode Check');
  const contractNames = ['MockWLTC', 'MockOracle', 'LitbreakTokenV2'];

  for (const name of contractNames) {
    try {
      const factory = await hre.ethers.getContractFactory(name);

      // ethers v6: factory.bytecode is the deployment bytecode
      const bytecode = factory.bytecode || '';
      const bytecodeLen = bytecode.length;

      console.log(`  ${name}:`);
      console.log(`    factory.bytecode length: ${bytecodeLen} ${bytecodeLen > 2 ? '✅' : '❌ EMPTY'}`);
      console.log(`    factory.bytecode preview: ${bytecode.substring(0, 40)}...`);

      // Also check if the factory has the interface
      if (factory.interface) {
        const fragments = factory.interface.fragments || [];
        console.log(`    Interface fragments: ${fragments.length}`);
      }
    } catch (err) {
      console.log(`  ${name}: ❌ getContractFactory failed: ${err.message}`);
    }
  }
  console.log('');

  // ── 5. Check for dbg files (Hardhat debug artifacts) ──
  console.log('[5] Debug Artifacts');
  const dbgPaths = [
    './artifacts/contracts/MockWLTC.sol/MockWLTC.dbg.json',
    './artifacts/contracts/MockOracle.sol/MockOracle.dbg.json',
    './artifacts/contracts/LitbreakTokenV2.sol/LitbreakTokenV2.dbg.json',
  ];

  for (const dbgPath of dbgPaths) {
    const fullPath = path.resolve(__dirname, '..', dbgPath);
    if (fs.existsSync(fullPath)) {
      const dbg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      console.log(`  ${path.basename(dbgPath)}: exists`);
      console.log(`    buildInfo ref: ${dbg._format || 'unknown format'}`);

      // Check the build info file
      if (dbg.buildInfo) {
        const buildInfoPath = path.resolve(path.dirname(fullPath), dbg.buildInfo);
        if (fs.existsSync(buildInfoPath)) {
          const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
          const solcVersion = buildInfo.solcVersion || 'unknown';
          console.log(`    solc version used: ${solcVersion}`);

          // Check output contracts
          if (buildInfo.output && buildInfo.output.contracts) {
            for (const [file, contracts] of Object.entries(buildInfo.output.contracts)) {
              for (const [contractName, contractData] of Object.entries(contracts)) {
                const hasBytecode = contractData.evm &&
                  contractData.evm.bytecode &&
                  contractData.evm.bytecode.object &&
                  contractData.evm.bytecode.object.length > 0;
                console.log(`    ${file}:${contractName} bytecode in buildInfo: ${hasBytecode ? '✅' : '❌ EMPTY'}`);
              }
            }
          }
        } else {
          console.log(`    buildInfo file NOT FOUND: ${buildInfoPath}`);
        }
      }
    } else {
      console.log(`  ${path.basename(dbgPath)}: not found`);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Diagnostic Complete');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('If bytecode is empty in artifacts but source files look correct:');
  console.log('  1. rm -rf cache artifacts node_modules/.cache');
  console.log('  2. npm install');
  console.log('  3. npx hardhat compile --force --verbose');
  console.log('  4. Re-run this diagnostic');
  console.log('');
  console.log('If bytecode is present in buildInfo but empty in artifact JSON:');
  console.log('  → Hardhat artifact extraction bug. Try upgrading:');
  console.log('     npm install hardhat@latest @nomicfoundation/hardhat-ethers@latest');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Diagnostic failed:', error);
    process.exit(1);
  });
