/**
 * RevertDecoder — Extracts human-readable error messages from simulated
 * contract reverts and JavaScript errors.
 */

const KNOWN_REVERT_REASONS: Record<string, string> = {
  'LitbreakProtocol: zero LTC amount': 'Cannot mint with zero LTC — enter an amount greater than 0.',
  'LitbreakProtocol: hard cap exceeded': 'Hard cap reached — no more POWER tokens can be minted.',
  'LitbreakProtocol: insufficient balance': 'Insufficient POWER token balance for this operation.',
  'LitbreakProtocol: insufficient POWER balance': 'You do not have enough POWER tokens.',
  'LitbreakProtocol: insufficient collateral': 'Protocol does not have enough LTC collateral for this redemption.',
  'LitbreakProtocol: paused': 'The protocol is currently paused by the admin.',
  'LitbreakProtocol: transfer to zero address': 'Cannot transfer to the zero address (0x0000...0000).',
  'LitbreakProtocol: approve to zero address': 'Cannot approve the zero address as a spender.',
  'LitbreakProtocol: zero exchange rate': 'Exchange rate cannot be set to zero.',
  'LitbreakProtocol: fee too high': 'Protocol fee cannot exceed 500 basis points (5%).',
  'LitbreakProtocol: LTC transfer failed': 'LTC transfer to your wallet failed — please try again.',
  'LitbreakProtocol: reentrant call': 'Reentrancy detected — transaction rejected for safety.',
};

/**
 * Decode a revert reason or error into a user-friendly message.
 */
export function decodeRevertReason(error: unknown): string {
  if (error instanceof Error) {
    // Check if the error message matches a known revert reason
    for (const [key, friendly] of Object.entries(KNOWN_REVERT_REASONS)) {
      if (error.message.includes(key)) {
        return friendly;
      }
    }
    return error.message;
  }

  if (typeof error === 'string') {
    for (const [key, friendly] of Object.entries(KNOWN_REVERT_REASONS)) {
      if (error.includes(key)) {
        return friendly;
      }
    }
    return error;
  }

  return 'Unknown error occurred';
}
