/**
 * Web3 Error Decoder — Translates blockchain errors into user-friendly messages.
 *
 * Handles:
 *   - MetaMask error codes (4001, 4100, 4200, 4900, 4901, -32000 to -32603)
 *   - Solidity revert reasons (parsed from error data)
 *   - Network errors (timeout, disconnected)
 *   - Gas estimation failures
 *   - Nonce issues
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DecodedError {
  /** User-friendly error message */
  message: string;
  /** Technical error code (if available) */
  code: string | number | null;
  /** Whether the error is recoverable (user can retry) */
  recoverable: boolean;
  /** Suggested action for the user */
  suggestion: string;
  /** Original error for debugging */
  original: unknown;
}

// ─── Known Revert Reasons ────────────────────────────────────────────────────

const REVERT_MESSAGES: Record<string, string> = {
  'LitbreakProtocol: paused': 'The protocol is currently paused. Please try again later.',
  'LitbreakProtocol: zero LTC amount': 'You must send a non-zero amount of LTC.',
  'LitbreakProtocol: oracle data too old':
    'Oracle data is stale. The protocol is temporarily paused for safety.',
  'LitbreakProtocol: staleness pause active':
    'The protocol is paused due to stale oracle data. Waiting for fresh oracle submissions.',
  'LitbreakProtocol: hard cap exceeded':
    'The maximum POWER supply has been reached. No more tokens can be minted.',
  'LitbreakProtocol: mint amount is zero':
    'The amount is too small to mint any POWER tokens after fees.',
  'LitbreakProtocol: zero POWER amount': 'You must redeem a non-zero amount of POWER.',
  'LitbreakProtocol: insufficient POWER balance':
    'You don\'t have enough POWER tokens for this redemption.',
  'LitbreakProtocol: exchange rate is zero':
    'Exchange rate error. Please contact support.',
  'LitbreakProtocol: redeem amount is zero':
    'The amount is too small to redeem any LTC after fees.',
  'LitbreakProtocol: insufficient collateral':
    'Insufficient protocol collateral. Try a smaller amount.',
  'LitbreakProtocol: LTC transfer failed':
    'LTC transfer failed. Your POWER tokens have been returned.',
  'LitbreakProtocol: transfer to zero address':
    'Cannot transfer to the zero address.',
  'LitbreakProtocol: zero transfer amount':
    'Transfer amount must be greater than zero.',
  'LitbreakProtocol: insufficient balance':
    'Insufficient POWER balance for this transfer.',
  'LitbreakProtocol: insufficient allowance':
    'Insufficient allowance. Please approve the spender first.',
  'LitbreakProtocol: approve to zero address':
    'Cannot approve the zero address as a spender.',
  'LitbreakProtocol: submission cooldown active':
    'Oracle submission cooldown is active. Please wait before submitting again.',
  'LitbreakProtocol: price out of bounds':
    'The submitted price is outside the acceptable range.',
  'LitbreakProtocol: price change too large vs aggregated':
    'Price change exceeds the maximum allowed deviation from the aggregated price.',
  'LitbreakProtocol: price change too large vs own previous':
    'Price change exceeds the maximum allowed deviation from your previous submission.',
};

// ─── MetaMask Error Codes ────────────────────────────────────────────────────

const METAMASK_ERRORS: Record<number, { message: string; recoverable: boolean; suggestion: string }> = {
  4001: {
    message: 'Transaction rejected by user.',
    recoverable: true,
    suggestion: 'Click the confirm button in your wallet to proceed.',
  },
  4100: {
    message: 'Wallet is locked or unauthorized.',
    recoverable: true,
    suggestion: 'Please unlock your wallet and try again.',
  },
  4200: {
    message: 'This method is not supported by your wallet.',
    recoverable: false,
    suggestion: 'Try using a different wallet provider.',
  },
  4900: {
    message: 'Wallet is disconnected from the network.',
    recoverable: true,
    suggestion: 'Check your internet connection and reconnect your wallet.',
  },
  4901: {
    message: 'Wallet is not connected to the required chain.',
    recoverable: true,
    suggestion: 'Switch to the correct network in your wallet.',
  },
  // JSON-RPC errors
  [-32700 as number]: {
    message: 'Invalid request format.',
    recoverable: false,
    suggestion: 'Please refresh the page and try again.',
  },
  [-32600 as number]: {
    message: 'Invalid request.',
    recoverable: false,
    suggestion: 'Please refresh the page and try again.',
  },
  [-32601 as number]: {
    message: 'Method not found.',
    recoverable: false,
    suggestion: 'Your wallet may not support this operation.',
  },
  [-32602 as number]: {
    message: 'Invalid parameters.',
    recoverable: false,
    suggestion: 'Please check your input values and try again.',
  },
  [-32603 as number]: {
    message: 'Internal JSON-RPC error.',
    recoverable: true,
    suggestion: 'The RPC node may be experiencing issues. Try again in a moment.',
  },
  [-32000 as number]: {
    message: 'Transaction execution failed.',
    recoverable: true,
    suggestion: 'The transaction may have been reverted. Check your inputs.',
  },
  [-32001 as number]: {
    message: 'Resource not found.',
    recoverable: true,
    suggestion: 'The requested resource was not found on-chain.',
  },
  [-32002 as number]: {
    message: 'Resource unavailable.',
    recoverable: true,
    suggestion: 'The RPC node is busy. Please try again.',
  },
  [-32003 as number]: {
    message: 'Transaction rejected.',
    recoverable: true,
    suggestion: 'The transaction was rejected by the network. Check gas settings.',
  },
};

// ─── Error Decoder ───────────────────────────────────────────────────────────

/**
 * Decode a blockchain error into a user-friendly format.
 *
 * Handles ethers.js v6 error shapes, MetaMask provider errors,
 * raw revert strings, and generic JavaScript errors.
 */
export function decodeWeb3Error(error: unknown): DecodedError {
  // Default fallback
  const fallback: DecodedError = {
    message: 'An unexpected error occurred.',
    code: null,
    recoverable: true,
    suggestion: 'Please try again. If the issue persists, refresh the page.',
    original: error,
  };

  if (!error) return fallback;

  // ─── String errors ─────────────────────────────────────────────────
  if (typeof error === 'string') {
    const revertMsg = REVERT_MESSAGES[error];
    if (revertMsg) {
      return {
        message: revertMsg,
        code: 'REVERT',
        recoverable: true,
        suggestion: 'Check the error details and try again.',
        original: error,
      };
    }
    return { ...fallback, message: error };
  }

  // ─── Object errors ────────────────────────────────────────────────
  const err = error as any;

  // ethers.js v6 error shape: { code, reason, message, data, transaction }
  const code = err.code ?? err.error?.code ?? null;
  const reason = err.reason ?? err.error?.reason ?? err.error?.message ?? err.message ?? '';
  const data = err.data ?? err.error?.data ?? '';

  // Check MetaMask error codes first
  if (typeof code === 'number' && METAMASK_ERRORS[code]) {
    const meta = METAMASK_ERRORS[code];
    return {
      message: meta.message,
      code,
      recoverable: meta.recoverable,
      suggestion: meta.suggestion,
      original: error,
    };
  }

  // ethers.js ACTION_REJECTED (user denied tx)
  if (code === 'ACTION_REJECTED' || code === 'USER_REJECTED') {
    return {
      message: 'Transaction rejected by user.',
      code,
      recoverable: true,
      suggestion: 'Click confirm in your wallet to proceed.',
      original: error,
    };
  }

  // ethers.js INSUFFICIENT_FUNDS
  if (code === 'INSUFFICIENT_FUNDS') {
    return {
      message: 'Insufficient funds for this transaction.',
      code,
      recoverable: false,
      suggestion: 'Add more LTC to your wallet to cover the transaction and gas fees.',
      original: error,
    };
  }

  // ethers.js NONCE_EXPIRED
  if (code === 'NONCE_EXPIRED' || code === 'REPLACEMENT_UNDERPRICED') {
    return {
      message: 'Transaction nonce conflict.',
      code,
      recoverable: true,
      suggestion: 'Reset your wallet\'s pending transactions and try again.',
      original: error,
    };
  }

  // ethers.js UNPREDICTABLE_GAS_LIMIT (usually means tx will revert)
  if (code === 'UNPREDICTABLE_GAS_LIMIT') {
    // Try to extract revert reason
    const revertReason = extractRevertReason(reason) || extractRevertReason(data);
    if (revertReason && REVERT_MESSAGES[revertReason]) {
      return {
        message: REVERT_MESSAGES[revertReason],
        code: 'REVERT',
        recoverable: true,
        suggestion: 'Check the error details and adjust your inputs.',
        original: error,
      };
    }
    return {
      message: 'Transaction will likely fail.',
      code,
      recoverable: true,
      suggestion: revertReason || 'Check your inputs and try again.',
      original: error,
    };
  }

  // ethers.js CALL_EXCEPTION (revert during eth_call or tx execution)
  if (code === 'CALL_EXCEPTION') {
    const revertReason = extractRevertReason(reason) || extractRevertReason(data);
    if (revertReason && REVERT_MESSAGES[revertReason]) {
      return {
        message: REVERT_MESSAGES[revertReason],
        code: 'REVERT',
        recoverable: true,
        suggestion: 'Check the error details and adjust your inputs.',
        original: error,
      };
    }
    return {
      message: revertReason || 'Contract call failed.',
      code,
      recoverable: true,
      suggestion: 'The transaction was reverted by the contract.',
      original: error,
    };
  }

  // Network/timeout errors
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT' || code === 'SERVER_ERROR') {
    return {
      message: 'Network connection error.',
      code,
      recoverable: true,
      suggestion: 'Check your internet connection and try again.',
      original: error,
    };
  }

  // Try to match revert reason from message string
  const revertFromMsg = extractRevertReason(reason) || extractRevertReason(err.message || '');
  if (revertFromMsg && REVERT_MESSAGES[revertFromMsg]) {
    return {
      message: REVERT_MESSAGES[revertFromMsg],
      code: 'REVERT',
      recoverable: true,
      suggestion: 'Check the error details and adjust your inputs.',
      original: error,
    };
  }

  // Generic error with message
  if (err.message) {
    return {
      ...fallback,
      message: err.message.length > 200 ? err.message.slice(0, 200) + '...' : err.message,
      code,
    };
  }

  return fallback;
}

/**
 * Extract a Solidity revert reason string from an error message or data.
 * Looks for patterns like: "LitbreakProtocol: ..." or "reverted with reason string '...'"
 */
function extractRevertReason(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  // Direct match: "LitbreakProtocol: ..."
  const directMatch = input.match(/LitbreakProtocol:\s[^"']+/);
  if (directMatch) return directMatch[0].trim();

  // ethers.js v6 pattern: reverted with reason string "..."
  const reasonMatch = input.match(/reverted with reason string ["'](.+?)["']/);
  if (reasonMatch) return reasonMatch[1];

  // ethers.js v6 pattern: execution reverted: "..."
  const execMatch = input.match(/execution reverted:\s*["']?(.+?)["']?\s*$/);
  if (execMatch) return execMatch[1];

  return null;
}

/**
 * Check if an error is a user rejection (should not show error toast).
 */
export function isUserRejection(error: unknown): boolean {
  if (!error) return false;
  const err = error as any;
  const code = err.code ?? err.error?.code;
  return code === 4001 || code === 'ACTION_REJECTED' || code === 'USER_REJECTED';
}
