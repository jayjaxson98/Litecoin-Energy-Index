/**
 * Web3 Error Decoder — Translates blockchain errors into user-friendly messages.
 *
 * Resolves: [HIGH] No error handling for contract reverts in mint/redeem
 * Resolves: [HIGH] Missing modifier revert handling for whenNotPaused and nonReentrant
 *
 * Handles:
 *   - MetaMask error codes (4001, 4100, 4200, 4900, 4901, -32000 to -32603)
 *   - Solidity revert reasons (parsed from error data)
 *   - LitbreakProtocol-specific revert strings (including modifier reverts)
 *   - OpenZeppelin custom errors (EnforcedPause, ReentrancyGuardReentrantCall)
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

// ─── LitbreakProtocol Revert Reasons ─────────────────────────────────────────

const LITBREAK_REVERT_MESSAGES: Record<string, { message: string; suggestion: string }> = {
  // ─── Modifier Reverts ──────────────────────────────────────────────────
  'Contract paused': {
    message: 'The protocol is currently paused.',
    suggestion: 'Minting, redeeming, and transfers are temporarily disabled. Please wait until the protocol is unpaused by the owner.',
  },
  'Reentrant call': {
    message: 'Transaction rejected — reentrancy detected.',
    suggestion: 'This is a security protection. Please try your transaction again in a moment.',
  },
  'Not owner': {
    message: 'This action requires owner privileges.',
    suggestion: 'Only the contract owner can perform this operation.',
  },
  'Not oracle or owner': {
    message: 'This action requires oracle or owner privileges.',
    suggestion: 'Only registered oracles or the contract owner can perform this operation.',
  },

  // ─── Mint Reverts ──────────────────────────────────────────────────────
  'Zero LTC': {
    message: 'You must send a non-zero amount of LTC.',
    suggestion: 'Enter an amount greater than zero to mint LITB tokens.',
  },
  'Stale price data': {
    message: 'Oracle price data is stale.',
    suggestion: 'The protocol is waiting for fresh oracle data. Please try again later.',
  },
  'Oracle staleness pause active': {
    message: 'The protocol is paused due to stale oracle data.',
    suggestion: 'Minting and redeeming are temporarily unavailable. Check back soon.',
  },
  'Exceeds hard cap': {
    message: 'The maximum LITB supply has been reached.',
    suggestion: 'No more tokens can be minted. The hard cap is 21,000,000 LITB.',
  },

  // ─── Redeem Reverts ────────────────────────────────────────────────────
  'Zero amount': {
    message: 'You must redeem a non-zero amount.',
    suggestion: 'Enter an amount greater than zero.',
  },
  'Insufficient balance': {
    message: 'You don\'t have enough LITB tokens.',
    suggestion: 'Check your balance and enter a smaller amount.',
  },
  'Insufficient LTC reserves': {
    message: 'The protocol doesn\'t have enough LTC reserves.',
    suggestion: 'Try redeeming a smaller amount or wait for more liquidity.',
  },
  'LTC transfer failed': {
    message: 'LTC transfer to your wallet failed.',
    suggestion: 'Your wallet may be a contract that rejects LTC. Try a different wallet.',
  },

  // ─── ERC-20 Reverts ────────────────────────────────────────────────────
  'Zero address': {
    message: 'Cannot interact with the zero address.',
    suggestion: 'Please provide a valid recipient address.',
  },
  'Insufficient allowance': {
    message: 'Insufficient spending allowance.',
    suggestion: 'Approve the spender for a sufficient amount first.',
  },
  'Decreased below zero': {
    message: 'Cannot decrease allowance below zero.',
    suggestion: 'The decrease amount exceeds the current allowance.',
  },

  // ─── Oracle Reverts ────────────────────────────────────────────────────
  'Not oracle': {
    message: 'This address is not an authorized oracle.',
    suggestion: 'Only registered oracles can submit price data.',
  },
  'Price out of range': {
    message: 'The submitted price is outside the acceptable range.',
    suggestion: 'Price must be between $0.01 and $1.00 per kWh.',
  },
  'Cooldown active': {
    message: 'Oracle submission cooldown is active.',
    suggestion: 'Please wait 60 seconds between oracle submissions.',
  },
  'Exceeds self-change cap': {
    message: 'Price change exceeds the maximum allowed deviation.',
    suggestion: 'The new price is too far from your previous submission.',
  },

  // ─── Admin Reverts ─────────────────────────────────────────────────────
  'Already oracle': {
    message: 'This address is already registered as an oracle.',
    suggestion: 'The oracle is already active.',
  },
  'Max oracles reached': {
    message: 'Maximum number of oracles reached.',
    suggestion: 'Remove an existing oracle before adding a new one.',
  },
  'Would break quorum': {
    message: 'Cannot remove oracle — would break minimum quorum.',
    suggestion: 'At least 2 oracles must remain active.',
  },
  'Rate out of range': {
    message: 'Exchange rate is outside the acceptable range.',
    suggestion: 'Rate must be between 1 and 10,000 (scaled by 1e18).',
  },
  'Rate change exceeds cap': {
    message: 'Exchange rate change exceeds the maximum allowed per update.',
    suggestion: 'Maximum 20% change per update. Use smaller increments.',
  },
  'Fee too high': {
    message: 'Fee exceeds the maximum allowed (5%).',
    suggestion: 'Set a fee of 500 basis points or less.',
  },
  'Not stale-paused': {
    message: 'The protocol is not in a staleness pause state.',
    suggestion: 'This action is only available during oracle staleness pauses.',
  },

  // ─── Emergency Reverts ─────────────────────────────────────────────────
  'Must be paused': {
    message: 'Emergency withdrawal requires the contract to be paused.',
    suggestion: 'Pause the contract first, then perform the emergency withdrawal.',
  },

  // ─── Auto Recovery Reverts (EXT-04, P8-01) ────────────────────────────
  'No staleness timestamp': {
    message: 'No staleness trigger timestamp recorded.',
    suggestion: 'The staleness pause was not triggered through the normal flow.',
  },
  'Recovery timeout not reached': {
    message: 'Auto-recovery timeout has not been reached yet.',
    suggestion: 'The 24-hour auto-recovery period has not elapsed.',
  },
  'Recovery cooldown active': {
    message: 'Auto-recovery cooldown is active.',
    suggestion: 'Please wait at least 1 hour between auto-recovery attempts.',
  },
  'No fresh oracle data available': {
    message: 'No fresh oracle data is available for auto-recovery.',
    suggestion: 'At least one oracle must have submitted fresh data before recovery can proceed.',
  },

  // ─── Timelock Reverts (EXT-05, P5-02) ─────────────────────────────────
  'Action already queued': {
    message: 'This timelock action is already queued.',
    suggestion: 'Cancel the existing action before queuing a new one.',
  },
  'Action not queued': {
    message: 'This timelock action has not been queued.',
    suggestion: 'Queue the action first, then wait for the timelock delay.',
  },
  'Timelock not expired': {
    message: 'The timelock delay has not expired yet.',
    suggestion: 'Wait for the 48-hour timelock period to elapse.',
  },
  'Action ID mismatch': {
    message: 'The action ID does not match the provided parameters.',
    suggestion: 'Ensure the parameters match exactly what was queued.',
  },

  // ─── Baseline Reverts (P6-01) ─────────────────────────────────────────
  'Baseline out of range': {
    message: 'The baseline price is outside the acceptable range.',
    suggestion: 'Baseline must be between $0.01 and $1.00 per kWh (scaled by 1e6).',
  },
};

/**
 * OpenZeppelin custom error selectors (Solidity 0.8.20+ / OZ v5).
 * These are 4-byte selectors for custom errors that may appear in revert data.
 */
const CUSTOM_ERROR_SELECTORS: Record<string, { message: string; suggestion: string }> = {
  'd93c0665': {
    message: 'The protocol is currently paused (EnforcedPause).',
    suggestion: 'Minting, redeeming, and transfers are temporarily disabled. Please wait until the protocol is unpaused.',
  },
  '8dfc202b': {
    message: 'The protocol is expected to be paused for this operation.',
    suggestion: 'This action can only be performed when the contract is paused.',
  },
  '3ee5aeb5': {
    message: 'Transaction rejected — reentrancy detected (ReentrancyGuardReentrantCall).',
    suggestion: 'This is a security protection. Please try your transaction again.',
  },
};

// ─── MetaMask Error Codes ────────────────────────────────────────────────────

interface MetaMaskErrorInfo {
  message: string;
  recoverable: boolean;
  suggestion: string;
}

const METAMASK_ERRORS = new Map<number, MetaMaskErrorInfo>([
  [4001, {
    message: 'Transaction rejected by user.',
    recoverable: true,
    suggestion: 'Click the confirm button in your wallet to proceed.',
  }],
  [4100, {
    message: 'Wallet is locked or unauthorized.',
    recoverable: true,
    suggestion: 'Please unlock your wallet and try again.',
  }],
  [4200, {
    message: 'This method is not supported by your wallet.',
    recoverable: false,
    suggestion: 'Try using a different wallet provider.',
  }],
  [4900, {
    message: 'Wallet is disconnected from the network.',
    recoverable: true,
    suggestion: 'Check your internet connection and reconnect your wallet.',
  }],
  [4901, {
    message: 'Wallet is not connected to the required chain.',
    recoverable: true,
    suggestion: 'Switch to the correct network in your wallet.',
  }],
  [-32700, {
    message: 'Invalid request format.',
    recoverable: false,
    suggestion: 'Please refresh the page and try again.',
  }],
  [-32600, {
    message: 'Invalid request.',
    recoverable: false,
    suggestion: 'Please refresh the page and try again.',
  }],
  [-32601, {
    message: 'Method not found.',
    recoverable: false,
    suggestion: 'Your wallet may not support this operation.',
  }],
  [-32602, {
    message: 'Invalid parameters.',
    recoverable: false,
    suggestion: 'Please check your input values and try again.',
  }],
  [-32603, {
    message: 'Internal JSON-RPC error.',
    recoverable: true,
    suggestion: 'The RPC node may be experiencing issues. Try again in a moment.',
  }],
  [-32000, {
    message: 'Transaction execution failed.',
    recoverable: true,
    suggestion: 'The transaction may have been reverted. Check your inputs.',
  }],
  [-32001, {
    message: 'Resource not found.',
    recoverable: true,
    suggestion: 'The requested resource was not found on-chain.',
  }],
  [-32002, {
    message: 'Resource unavailable.',
    recoverable: true,
    suggestion: 'The RPC node is busy. Please try again.',
  }],
  [-32003, {
    message: 'Transaction rejected.',
    recoverable: true,
    suggestion: 'The transaction was rejected by the network. Check gas settings.',
  }],
]);

// ─── Error Decoder ───────────────────────────────────────────────────────────

export function decodeWeb3Error(error: unknown): DecodedError {
  const fallback: DecodedError = {
    message: 'An unexpected error occurred.',
    code: null,
    recoverable: true,
    suggestion: 'Please try again. If the issue persists, refresh the page.',
    original: error,
  };

  if (!error) return fallback;

  if (typeof error === 'string') {
    const litbreakMsg = LITBREAK_REVERT_MESSAGES[error];
    if (litbreakMsg) {
      return {
        message: litbreakMsg.message,
        code: 'REVERT',
        recoverable: true,
        suggestion: litbreakMsg.suggestion,
        original: error,
      };
    }
    return { ...fallback, message: error };
  }

  const err = error as Record<string, unknown>;

  const code = (err.code ?? (err.error as Record<string, unknown>)?.code ?? null) as string | number | null;
  const reason = (
    err.reason ??
    (err.error as Record<string, unknown>)?.reason ??
    (err.error as Record<string, unknown>)?.message ??
    err.message ??
    ''
  ) as string;
  const data = (err.data ?? (err.error as Record<string, unknown>)?.data ?? '') as string;

  const customErrorResult = decodeCustomErrorSelector(data);
  if (customErrorResult) {
    return {
      message: customErrorResult.message,
      code: 'CUSTOM_ERROR',
      recoverable: true,
      suggestion: customErrorResult.suggestion,
      original: error,
    };
  }

  if (typeof code === 'number') {
    const meta = METAMASK_ERRORS.get(code);
    if (meta) {
      return {
        message: meta.message,
        code,
        recoverable: meta.recoverable,
        suggestion: meta.suggestion,
        original: error,
      };
    }
  }

  if (code === 'ACTION_REJECTED' || code === 'USER_REJECTED') {
    return {
      message: 'Transaction rejected by user.',
      code,
      recoverable: true,
      suggestion: 'Click confirm in your wallet to proceed.',
      original: error,
    };
  }

  if (code === 'INSUFFICIENT_FUNDS') {
    return {
      message: 'Insufficient funds for this transaction.',
      code,
      recoverable: false,
      suggestion: 'Add more LTC to your wallet to cover the transaction and gas fees.',
      original: error,
    };
  }

  if (code === 'NONCE_EXPIRED' || code === 'REPLACEMENT_UNDERPRICED') {
    return {
      message: 'Transaction nonce conflict.',
      code,
      recoverable: true,
      suggestion: 'Reset your wallet\'s pending transactions and try again.',
      original: error,
    };
  }

  if (code === 'UNPREDICTABLE_GAS_LIMIT') {
    const revertReason = extractRevertReason(reason) || extractRevertReason(data);
    if (revertReason) {
      const litbreakMsg = LITBREAK_REVERT_MESSAGES[revertReason];
      if (litbreakMsg) {
        return {
          message: litbreakMsg.message,
          code: 'REVERT',
          recoverable: true,
          suggestion: litbreakMsg.suggestion,
          original: error,
        };
      }
    }
    const customErr = decodeCustomErrorSelector(data);
    if (customErr) {
      return {
        message: customErr.message,
        code: 'CUSTOM_ERROR',
        recoverable: true,
        suggestion: customErr.suggestion,
        original: error,
      };
    }
    return {
      message: 'Transaction will likely fail.',
      code,
      recoverable: true,
      suggestion: revertReason || 'Check your inputs and try again. The contract may be paused or your balance may be insufficient.',
      original: error,
    };
  }

  if (code === 'CALL_EXCEPTION') {
    const customErr = decodeCustomErrorSelector(data);
    if (customErr) {
      return {
        message: customErr.message,
        code: 'CUSTOM_ERROR',
        recoverable: true,
        suggestion: customErr.suggestion,
        original: error,
      };
    }

    const revertReason = extractRevertReason(reason) || extractRevertReason(data);
    if (revertReason) {
      const litbreakMsg = LITBREAK_REVERT_MESSAGES[revertReason];
      if (litbreakMsg) {
        return {
          message: litbreakMsg.message,
          code: 'REVERT',
          recoverable: true,
          suggestion: litbreakMsg.suggestion,
          original: error,
        };
      }
    }
    return {
      message: revertReason || 'Contract call failed.',
      code,
      recoverable: true,
      suggestion: 'The transaction was reverted by the contract. The contract may be paused.',
      original: error,
    };
  }

  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT' || code === 'SERVER_ERROR') {
    return {
      message: 'Network connection error.',
      code,
      recoverable: true,
      suggestion: 'Check your internet connection and try again.',
      original: error,
    };
  }

  const revertFromMsg = extractRevertReason(reason) || extractRevertReason((err.message || '') as string);
  if (revertFromMsg) {
    const litbreakMsg = LITBREAK_REVERT_MESSAGES[revertFromMsg];
    if (litbreakMsg) {
      return {
        message: litbreakMsg.message,
        code: 'REVERT',
        recoverable: true,
        suggestion: litbreakMsg.suggestion,
        original: error,
      };
    }
  }

  const legacyOzResult = matchLegacyOzRevert((err.message || '') as string);
  if (legacyOzResult) {
    return {
      message: legacyOzResult.message,
      code: 'REVERT',
      recoverable: true,
      suggestion: legacyOzResult.suggestion,
      original: error,
    };
  }

  if (err.message && typeof err.message === 'string') {
    return {
      ...fallback,
      message: err.message.length > 200 ? err.message.slice(0, 200) + '...' : err.message,
      code,
    };
  }

  return fallback;
}

function decodeCustomErrorSelector(data: unknown): { message: string; suggestion: string } | null {
  if (!data || typeof data !== 'string') return null;

  const hex = data.startsWith('0x') ? data.slice(2) : data;
  if (hex.length < 8) return null;

  const selector = hex.slice(0, 8).toLowerCase();
  return CUSTOM_ERROR_SELECTORS[selector] || null;
}

function matchLegacyOzRevert(message: string): { message: string; suggestion: string } | null {
  if (!message) return null;

  if (message.includes('Pausable: paused')) {
    return {
      message: 'The protocol is currently paused.',
      suggestion: 'Minting, redeeming, and transfers are temporarily disabled. Please wait until the protocol is unpaused.',
    };
  }
  if (message.includes('Pausable: not paused')) {
    return {
      message: 'The protocol is expected to be paused for this operation.',
      suggestion: 'This action can only be performed when the contract is paused.',
    };
  }

  if (message.includes('ReentrancyGuard: reentrant call')) {
    return {
      message: 'Transaction rejected — reentrancy detected.',
      suggestion: 'This is a security protection. Please try your transaction again.',
    };
  }

  return null;
}

function extractRevertReason(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const reasonMatch = input.match(/reverted with reason string ["'](.+?)["']/);
  if (reasonMatch) return reasonMatch[1];

  const execMatch = input.match(/execution reverted:\s*["']?(.+?)["']?\s*$/);
  if (execMatch) return execMatch[1];

  for (const key of Object.keys(LITBREAK_REVERT_MESSAGES)) {
    if (input.includes(key)) return key;
  }

  return null;
}

export function isUserRejection(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  const code = err.code ?? (err.error as Record<string, unknown>)?.code;
  return code === 4001 || code === 'ACTION_REJECTED' || code === 'USER_REJECTED';
}

export function isContractNotDeployed(error: unknown): boolean {
  if (!error) return false;
  const msg = String((error as Record<string, unknown>).message || error);
  return (
    msg.includes('contract not deployed') ||
    msg.includes('CALL_EXCEPTION') ||
    msg.includes('code is empty') ||
    msg.includes('returned no data')
  );
}

export function isPausedError(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  const message = String(err.message || err.reason || '');
  const data = String(err.data || '');

  if (message.includes('Contract paused')) return true;
  if (message.includes('Pausable: paused')) return true;
  if (data.startsWith('0x') && data.slice(2, 10).toLowerCase() === 'd93c0665') return true;

  return false;
}

export function isReentrancyError(error: unknown): boolean {
  if (!error) return false;
  const err = error as Record<string, unknown>;
  const message = String(err.message || err.reason || '');
  const data = String(err.data || '');

  if (message.includes('Reentrant call')) return true;
  if (message.includes('ReentrancyGuard: reentrant call')) return true;
  if (data.startsWith('0x') && data.slice(2, 10).toLowerCase() === '3ee5aeb5') return true;

  return false;
}
