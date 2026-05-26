import type { NetworkInfo } from '../../types';

/**
 * Request MetaMask to add a network if it doesn't already know about it.
 * Uses nativeCurrency from the NetworkInfo object — no hardcoded ETH.
 */
export async function addNetworkToWallet(network: NetworkInfo): Promise<void> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No injected provider found');

  await eth.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId:           `0x${network.chainId.toString(16)}`,
      chainName:         network.name,
      rpcUrls:           [network.rpcUrl],
      blockExplorerUrls: [network.explorerUrl],
      nativeCurrency:    network.nativeCurrency,
    }],
  });
}

/**
 * Switch to a network; if the wallet doesn't know it, add it first.
 */
export async function switchOrAddNetwork(network: NetworkInfo): Promise<void> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error('No injected provider found');

  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    });
  } catch (err: unknown) {
    // Error code 4902 = chain not added to wallet
    if ((err as { code?: number }).code === 4902) {
      await addNetworkToWallet(network);
    } else {
      throw err;
    }
  }
}
