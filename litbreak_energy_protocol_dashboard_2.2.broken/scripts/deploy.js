import { ethers, network } from 'hardhat';

const SUPPORTED_CHAINS = {
  1856: 'litvm-testnet',
  1857: 'litvm-mainnet',
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();
  const chainIdNum  = Number(chainId);

  if (!SUPPORTED_CHAINS[chainIdNum]) {
    throw new Error(
      `Unsupported chain ${chainIdNum}. Deploy to litvm-testnet (1856) or litvm-mainnet (1857).`
    );
  }

  console.log(`\n🚀 Deploying LitBreakProtocol`);
  console.log(`   Network  : ${SUPPORTED_CHAINS[chainIdNum]} (chainId ${chainIdNum})`);
  console.log(`   Deployer : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance  : ${ethers.formatUnits(balance, 18)} LTC\n`);

  // Oracle feed addresses — set via env or use zero address for testnet mocks
  const ltcUsdFeed = process.env.LTC_USD_FEED  ?? ethers.ZeroAddress;
  const energyFeed = process.env.ENERGY_FEED   ?? ethers.ZeroAddress;

  if (ltcUsdFeed === ethers.ZeroAddress || energyFeed === ethers.ZeroAddress) {
    console.warn('⚠️  Oracle feed addresses not set — using ZeroAddress (testnet only)');
  }

  const Factory  = await ethers.getContractFactory('LitBreakProtocol');
  const contract = await Factory.deploy(ltcUsdFeed, energyFeed);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ LitBreakProtocol deployed at: ${address}`);
  console.log(`   Explorer: https://explorer.litvm-testnet.io/address/${address}\n`);
  console.log(`Add to .env:\n   VITE_CONTRACT_ADDRESS=${address}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
