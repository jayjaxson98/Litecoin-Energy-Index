/**
 * ReadOnlyContext — Global read-only mode enforcement for the frontend.
 *
 * When READ_ONLY is true:
 *   - All write operations (mint, redeem, approve, transfer) are blocked
 *   - Input fields and submit buttons are disabled
 *   - A visual banner is displayed to inform users
 *   - API guard middleware prevents any write calls from reaching the backend
 *
 * Toggle via VITE_READ_ONLY_MODE env var or hardcoded default.
 */

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';

interface ReadOnlyContextType {
  /** Whether the frontend is in read-only mode */
  isReadOnly: boolean;
  /** Human-readable reason for read-only mode */
  reason: string;
  /**
   * Guard function — wraps any write action.
   * Returns true if the action is allowed, false if blocked.
   * Optionally logs the blocked action for debugging.
   */
  guardWrite: (actionName: string) => boolean;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  isReadOnly: true,
  reason: '',
  guardWrite: () => false,
});

export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

/**
 * Determine read-only state from environment variable.
 * Default: true (read-only enabled) — set VITE_READ_ONLY_MODE=false to disable.
 */
const IS_READ_ONLY = (() => {
  const envVal = (import.meta as any).env?.VITE_READ_ONLY_MODE;
  if (envVal === 'false' || envVal === '0') return false;
  return true; // Default to read-only
})();

const READ_ONLY_REASON = 'The Litbreak Protocol interface is currently in read-only mode during the LTC migration. Write operations are temporarily disabled.';

export function ReadOnlyProvider({ children }: { children: ReactNode }) {
  const guardWrite = useCallback((actionName: string): boolean => {
    if (IS_READ_ONLY) {
      console.warn(`[ReadOnly Guard] Blocked write action: ${actionName}`);
      return false;
    }
    return true;
  }, []);

  return (
    <ReadOnlyContext.Provider
      value={{
        isReadOnly: IS_READ_ONLY,
        reason: IS_READ_ONLY ? READ_ONLY_REASON : '',
        guardWrite,
      }}
    >
      {children}
    </ReadOnlyContext.Provider>
  );
}
