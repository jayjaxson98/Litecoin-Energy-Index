/**
 * RevertDecoder — Extracts human-readable error messages from simulated
 * contract reverts and JavaScript errors.
 *
 * Updated for Pass 10 (ETH→LTC migration) and modifier revert handling.
 * No imports from web3/ modules — standalone decoder for simulation layer.
 */

const KNOWN_REVERT_REASONS: Record<string, string> = {
  // ─── Modifier Reverts ──────────────────────────────────────────────────
  'Contract paused': 'The protocol is currently paused — minting, redeeming, and transfers are temporarily disabled.',
  'Reentrant call': 'Transaction rejected — reentrancy detected. This is a security protection. Please try again.',
  'Not owner': 'This action requires owner privileges. Only the contract owner can perform this operation.',
  'Not oracle or owner': 'This action requires oracle or owner privileges.',

  // ─── Mint/Redeem Reverts ───────────────────────────────────────────────
  'LitbreakProtocol: zero LTC amount': 'Cannot mint with zero LTC — enter an amount greater than 0.',
  'Zero LTC': 'Cannot mint with zero LTC — enter an amount greater than 0.',
  'LitbreakProtocol: hard cap exceeded': 'Hard cap reached — no more LITB tokens can be minted.',
  'Exceeds hard cap': 'Hard cap reached — no more LITB tokens can be minted.',
  'LitbreakProtocol: insufficient balance': 'Insufficient LITB token balance for this operation.',
  'Insufficient balance': 'You do not have enough LITB tokens for this operation.',
  'LitbreakProtocol: insufficient POWER balance': 'You do not have enough LITB tokens.',
  'LitbreakProtocol: insufficient collateral': 'Protocol does not have enough LTC collateral for this redemption.',
  'Insufficient LTC reserves': 'Protocol does not have enough LTC reserves for this redemption.',
  'LitbreakProtocol: paused': 'The protocol is currently paused by the admin.',
  'LitbreakProtocol: transfer to zero address': 'Cannot transfer to the zero address (0x0000...0000).',
  'Zero address': 'Cannot interact with the zero address (0x0000...0000).',
  'LitbreakProtocol: approve to zero address': 'Cannot approve the zero address as a spender.',
  'LitbreakProtocol: zero exchange rate': 'Exchange rate cannot be set to zero.',
  'LitbreakProtocol: fee too high': 'Protocol fee cannot exceed 500 basis points (5%).',
  'Fee too high': 'Protocol fee cannot exceed 500 basis points (5%).',
  'LitbreakProtocol: LTC transfer failed': 'LTC transfer to your wallet failed — please try again.',
  'LTC transfer failed': 'LTC transfer to your wallet failed — please try again.',
  'LitbreakProtocol: reentrant call': 'Reentrancy detected — transaction rejected for safety.',
  'Zero amount': 'Amount must be greater than zero.',

  // ─── Oracle Reverts ────────────────────────────────────────────────────
  'Stale price data': 'Oracle price data is stale — the protocol is waiting for fresh data.',
  'Oracle staleness pause active': 'The protocol is paused due to stale oracle data.',
  'Not oracle': 'This address is not an authorized oracle.',
  'Price out of range': 'The submitted price is outside the acceptable range ($0.01–$1.00/kWh).',
  'Cooldown active': 'Oracle submission cooldown is active — wait 60 seconds.',
  'Exceeds self-change cap': 'Price change exceeds the maximum allowed deviation from baseline.',
  'Baseline out of range': 'Baseline price is outside the acceptable range.',

  // ─── Admin Reverts ─────────────────────────────────────────────────────
  'Already oracle': 'This address is already registered as an oracle.',
  'Max oracles reached': 'Maximum number of oracles (5) reached.',
  'Would break quorum': 'Cannot remove oracle — would break minimum quorum of 2.',
  'Rate out of range': 'Exchange rate is outside the acceptable range.',
  'Rate change exceeds cap': 'Exchange rate change exceeds the maximum 20% per update.',
  'Not stale-paused': 'The protocol is not in a staleness pause state.',
  'Must be paused': 'Emergency withdrawal requires the contract to be paused first.',
  'Insufficient allowance': 'Insufficient spending allowance — approve the spender first.',
  'Decreased below zero': 'Cannot decrease allowance below zero.',

  // ─── Auto Recovery Reverts (EXT-04, P8-01) ────────────────────────────
  'No staleness timestamp': 'No staleness trigger timestamp recorded.',
  'Recovery timeout not reached': 'The 24-hour auto-recovery period has not elapsed.',
  'Recovery cooldown active': 'Auto-recovery cooldown is active — wait at least 1 hour.',
  'No fresh oracle data available': 'No fresh oracle data available for auto-recovery.',

  // ─── Timelock Reverts (EXT-05, P5-02) ─────────────────────────────────
  'Action already queued': 'This timelock action is already queued.',
  'Action not queued': 'This timelock action has not been queued.',
  'Timelock not expired': 'The 48-hour timelock delay has not expired.',
  'Action ID mismatch': 'The action ID does not match the provided parameters.',

  // ─── OpenZeppelin v4.x Legacy String Reverts ──────────────────────────
  'Pausable: paused': 'The protocol is currently paused — operations are temporarily disabled.',
  'Pausable: not paused': 'This action requires the contract to be paused.',
  'ReentrancyGuard: reentrant call': 'Reentrancy detected — transaction rejected for safety.',

  // ─── OpenZeppelin v5 Custom Error Names ────────────────────────────────
  'EnforcedPause': 'The protocol is currently paused (EnforcedPause).',
  'ExpectedPause': 'This action requires the contract to be paused (ExpectedPause).',
  'ReentrancyGuardReentrantCall': 'Reentrancy detected — transaction rejected (ReentrancyGuardReentrantCall).',
};

export function decodeRevertReason(error: unknown): string {
  if (error instanceof Error) {
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

export function isRevertDueToPause(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    msg.includes('Contract paused') ||
    msg.includes('Pausable: paused') ||
    msg.includes('EnforcedPause')
  );
}

export function isRevertDueToReentrancy(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    msg.includes('Reentrant call') ||
    msg.includes('ReentrancyGuard: reentrant call') ||
    msg.includes('ReentrancyGuardReentrantCall')
  );
}
