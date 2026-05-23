import React, { useCallback, useEffect, useState } from 'react';

// ─── Local approval helpers (decoupled from the energy-data hook) ───────────

async function checkAllowance(tokenAddress: string, amount: string, spenderAddress: string): Promise<boolean> {
  if (!tokenAddress || !spenderAddress) return false;
  await new Promise((r) => setTimeout(r, 300));
  void amount;
  // Demo: always returns false so the approval flow can be triggered
  return false;
}

async function approveToken(
  _token: { address: string; symbol: string; decimals: number },
  _amount: string,
  _spender: string
): Promise<{ hash: string }> {
  await new Promise((r) => setTimeout(r, 800));
  const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { hash };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApprovalButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onError'> {
  tokenAddress: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenName?: string;
  amount: string;
  spenderAddress?: string;
  onApprove?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ApprovalButton: React.FC<ApprovalButtonProps> = ({
  tokenAddress,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 18,
  tokenName = 'Token',
  amount,
  spenderAddress,
  onApprove,
  onError,
  className,
  children,
  disabled: _disabled,
  ...buttonProps
}) => {
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const verifyApproval = useCallback(async () => {
    if (!tokenAddress || !spenderAddress) {
      setChecking(false);
      setIsApproved(false);
      return;
    }
    setChecking(true);
    try {
      const result = await checkAllowance(tokenAddress, amount, spenderAddress);
      setIsApproved(Boolean(result));
    } catch {
      setIsApproved(false);
    } finally {
      setChecking(false);
    }
  }, [tokenAddress, spenderAddress, amount]);

  useEffect(() => {
    verifyApproval();
  }, [verifyApproval]);

  const handleApprove = async () => {
    if (!tokenAddress || !spenderAddress) return;
    setLoading(true);
    try {
      const tokenObj = { address: tokenAddress, symbol: tokenSymbol, decimals: tokenDecimals };
      const result = await approveToken(tokenObj, amount, spenderAddress);
      if (result.hash) {
        onApprove?.(result.hash);
      }
      setIsApproved(true);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = _disabled || loading || checking || isApproved || !spenderAddress;

  if (checking) {
    return (
      <button
        type="button"
        disabled
        className={className}
        style={baseStyle}
        {...buttonProps}
      >
        <span style={spinnerStyle} />
        Checking allowance…
      </button>
    );
  }

  if (isApproved) {
    return (
      <button
        type="button"
        disabled
        className={className}
        style={{ ...baseStyle, ...approvedStyle }}
        {...buttonProps}
      >
        <span>✓</span> Approved
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={isDisabled}
      className={className}
      style={baseStyle}
      {...buttonProps}
    >
      {loading ? (
        <>
          <span style={spinnerStyle} />
          Approving…
        </>
      ) : (
        children ?? 'Approve Token'
      )}
    </button>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: '1px solid #2F2F2F',
  backgroundColor: '#171717',
  color: '#FFFFFF',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontFamily: 'sans-serif',
  transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease',
};

const approvedStyle: React.CSSProperties = {
  backgroundColor: '#10b981',
  color: '#0F172A',
  borderColor: '#10b981',
  cursor: 'default',
};

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '14px',
  height: '14px',
  border: '2px solid rgba(255,255,255,0.2)',
  borderTopColor: '#9E7FFF',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};
