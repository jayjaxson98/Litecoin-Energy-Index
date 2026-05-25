/**
 * RevertDecoder — Maps Solidity revert reason strings from LitbreakProtocol.sol
 * to user-friendly error messages.
 *
 * Fix #14: No revert reason decoder existed. Contract uses descriptive require()
 * messages that should be translated to user-friendly language.
 */

const REVERT_REASON_MAP: Record<string, string> = {
  // ─── Mint/Redeem ────────────────────────────────────────────────────────
  'LitbreakProtocol: paused':
    'The protocol is currently paused. Transactions are temporarily disabled.',
  'LitbreakProtocol: zero LTC amount':
    'Please enter an amount greater than zero.',
  'LitbreakProtocol: hard cap reached':
    'The maximum supply of 84,000,000 POWER tokens has been reached. No more tokens can be minted.',
  'LitbreakProtocol: mint would exceed hard cap':
    'This mint would exceed the 84M POWER hard cap. Try a smaller amount.',
  'LitbreakProtocol: insufficient balance':
    "You don't have enough tokens for this transaction.",
  'LitbreakProtocol: insufficient POWER balance':
    'Your POWER token balance is too low for this redemption.',
  'LitbreakProtocol: mint amount too small':
    'The amount is too small to mint. Please try a larger amount.',
  'LitbreakProtocol: redeem amount too small':
    'The amount is too small to redeem. Please try a larger amount.',
  'LitbreakProtocol: insufficient collateral':
    "The protocol doesn't have enough LTC collateral to fulfill this redemption.",
  'LitbreakProtocol: LTC transfer failed':
    'The LTC transfer failed. Please try again.',

  // ─── Access Control ─────────────────────────────────────────────────────
  'LitbreakProtocol: not owner':
    'This action requires owner privileges.',
  'LitbreakProtocol: not authorized':
    'You are not authorized to perform this action.',
  'LitbreakProtocol: missing role':
    'Your account does not have the required role for this action.',

  // ─── Oracle / Timelock ──────────────────────────────────────────────────
  'LitbreakProtocol: timelock not expired':
    'The governance timelock has not expired yet. Please wait for the required delay.',
  'LitbreakProtocol: no pending change':
    'There is no pending oracle feed change to execute.',
  'LitbreakProtocol: invalid oracle address':
    'The proposed oracle address is invalid.',
  'LitbreakProtocol: stale oracle data':
    'The oracle price data is stale. The protocol is using fallback values.',

  // ─── ERC-20 ─────────────────────────────────────────────────────────────
  'LitbreakProtocol: transfer to zero address':
    'Cannot transfer tokens to the zero address.',
  'LitbreakProtocol: approve to zero address':
    'Cannot approve the zero address as a spender.',
  'LitbreakProtocol: insufficient allowance':
    'The spender does not have enough allowance for this transfer.',

  // ─── Generic ────────────────────────────────────────────────────────────
  'LitbreakProtocol: zero address':
    'A valid address is required (cannot be the zero address).',
  'LitbreakProtocol: invalid amount':
    'The specified amount is invalid.',
};

/**
 * Attempts to extract and decode a Solidity revert reason from an error object.
 * Falls back to the raw error message if no known revert reason is found.
 */
export function decodeRevertReason(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  const message = error instanceof Error ? error.message : String(error);

  // Check against known revert reasons
  for (const [revertString, friendlyMessage] of Object.entries(REVERT_REASON_MAP)) {
    if (message.includes(revertString)) {
      return friendlyMessage;
    }
  }

  // Check for common generic patterns
  if (message.includes('user rejected') || message.includes('User denied')) {
    return 'Transaction was rejected in your wallet.';
  }
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds to cover the transaction and gas costs.';
  }
  if (message.includes('nonce too low')) {
    return 'Transaction nonce conflict. Please try again.';
  }
  if (message.includes('gas required exceeds')) {
    return 'Transaction would require more gas than the block limit. Try a smaller amount.';
  }
  if (message.includes('execution reverted')) {
    // Try to extract the reason from "execution reverted: <reason>"
    const match = message.match(/execution reverted:\s*(.+)/i);
    if (match?.[1]) {
      const extracted = match[1].trim();
      // Check extracted reason against map
      for (const [revertString, friendlyMessage] of Object.entries(REVERT_REASON_MAP)) {
        if (extracted.includes(revertString)) {
          return friendlyMessage;
        }
      }
      return extracted;
    }
    return 'Transaction reverted by the contract. Please check your inputs.';
  }

  // Return original message if nothing matched (but cap length)
  if (message.length > 200) {
    return message.slice(0, 197) + '...';
  }

  return message;
}

/**
 * Returns the raw revert reason key if found, or null.
 * Useful for programmatic handling (e.g., checking if paused).
 */
export function extractRevertKey(error: unknown): string | null {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);

  for (const revertString of Object.keys(REVERT_REASON_MAP)) {
    if (message.includes(revertString)) {
      return revertString;
    }
  }
  return null;
}
