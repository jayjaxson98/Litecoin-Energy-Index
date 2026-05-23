import React, { useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatBalance } from '../types/wallet';
import './wallet.css';

type SendReceiveTab = 'send' | 'receive';
type SendState = 'idle' | 'sending' | 'success' | 'error';

interface FormErrors {
  to?: string;
  amount?: string;
}

export function SendReceive() {
  const { account, allBalances, send, isConnected } = useWallet();

  const [tab, setTab] = useState<SendReceiveTab>('send');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState(allBalances[0]?.symbol ?? 'LTC');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [copied, setCopied] = useState(false);

  const selectedBalance = allBalances.find((b) => b.symbol === selectedSymbol);

  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};
    if (!to.trim()) errs.to = 'Recipient address is required';
    else if (to.trim().length < 10) errs.to = 'Address appears too short';

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      errs.amount = 'Enter a valid amount';
    } else if (selectedBalance && amt > parseFloat(selectedBalance.amount)) {
      errs.amount = `Insufficient ${selectedSymbol} balance`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [to, amount, selectedBalance, selectedSymbol]);

  const handleSend = useCallback(async () => {
    if (!validate()) return;
    setSendState('sending');
    setErrorMsg('');
    try {
      const tx = await send({ to, amount, symbol: selectedSymbol, memo: memo || undefined });
      setTxHash(tx.hash);
      setSendState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
      setSendState('error');
    }
  }, [validate, send, to, amount, selectedSymbol, memo]);

  const handleReset = useCallback(() => {
    setTo('');
    setAmount('');
    setMemo('');
    setErrors({});
    setSendState('idle');
    setTxHash('');
    setErrorMsg('');
  }, []);

  const handleMaxAmount = useCallback(() => {
    if (selectedBalance) setAmount(selectedBalance.amount);
  }, [selectedBalance]);

  const handleCopyAddress = useCallback(() => {
    if (!account?.address) return;
    navigator.clipboard.writeText(account.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [account?.address]);

  if (!isConnected || !account) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--wallet-text-muted)', fontSize: '0.85rem' }}>
        Connect wallet to send or receive
      </div>
    );
  }

  // ── Success / Error states ─────────────────────────────────────────────
  if (sendState === 'success') {
    return (
      <div className="tx-status-card">
        <div className="tx-status-icon">✅</div>
        <h3 className="tx-status-title success">Transaction Sent!</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--wallet-text-secondary)', margin: 0 }}>
          Your transaction has been broadcast to the network.
        </p>
        <div className="tx-status-hash">
          <div style={{ fontSize: '0.68rem', color: 'var(--wallet-text-muted)', marginBottom: 4 }}>TX HASH</div>
          {txHash}
        </div>
        <button className="tx-status-back" onClick={handleReset}>Send Another</button>
      </div>
    );
  }

  if (sendState === 'error') {
    return (
      <div className="tx-status-card">
        <div className="tx-status-icon">❌</div>
        <h3 className="tx-status-title error">Transaction Failed</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--wallet-text-secondary)', margin: 0 }}>{errorMsg}</p>
        <button className="tx-status-back" onClick={handleReset}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="wallet-tabs" style={{ marginBottom: 16 }}>
        <button
          className={`wallet-tab ${tab === 'send' ? 'active' : ''}`}
          onClick={() => setTab('send')}
        >
          ↑ Send
        </button>
        <button
          className={`wallet-tab ${tab === 'receive' ? 'active' : ''}`}
          onClick={() => setTab('receive')}
        >
          ↓ Receive
        </button>
      </div>

      {tab === 'send' ? (
        <div className="send-receive-form">
          {/* Token selector */}
          {allBalances.length > 1 && (
            <div className="form-group">
              <label className="form-label">Asset</label>
              <select
                className="form-input"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {allBalances.map((b) => (
                  <option key={b.symbol} value={b.symbol}>
                    {b.symbol} — {formatBalance(b.amount, 6)} available
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient */}
          <div className="form-group">
            <label className="form-label">Recipient Address</label>
            <input
              className={`form-input ${errors.to ? 'error' : ''}`}
              type="text"
              placeholder={account.type === 'litecoin' ? 'L…' : '0x…'}
              value={to}
              onChange={(e) => { setTo(e.target.value); setErrors((p) => ({ ...p, to: undefined })); }}
            />
            {errors.to && <span className="form-error">{errors.to}</span>}
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">
              Amount
              {selectedBalance && (
                <span style={{ color: 'var(--wallet-text-muted)', fontWeight: 400, marginLeft: 6 }}>
                  (Balance: {formatBalance(selectedBalance.amount, 6)} {selectedSymbol})
                </span>
              )}
            </label>
            <div className="amount-input-wrapper">
              <input
                className={`form-input ${errors.amount ? 'error' : ''}`}
                type="number"
                placeholder="0.00"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: undefined })); }}
              />
              <button className="amount-max-btn" onClick={handleMaxAmount} type="button">MAX</button>
            </div>
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>

          {/* Memo */}
          <div className="form-group">
            <label className="form-label">Memo (optional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Note for this transaction"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Fee estimate */}
          <div className="send-fee-row">
            <span className="send-fee-label">Estimated Network Fee</span>
            <span className="send-fee-value">
              ~{(Math.random() * 0.0005 + 0.00001).toFixed(6)} {selectedSymbol}
            </span>
          </div>

          <button
            className="send-submit-btn"
            onClick={handleSend}
            disabled={sendState === 'sending'}
          >
            {sendState === 'sending' ? (
              <>
                <div className="wallet-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                Broadcasting…
              </>
            ) : (
              `Send ${selectedSymbol}`
            )}
          </button>
        </div>
      ) : (
        <div className="receive-panel">
          <div className="receive-qr">
            <div className="receive-qr-inner" />
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--wallet-text-secondary)', textAlign: 'center' }}>
            Your {account.network.name} address
          </div>

          <div className="receive-address-box">
            <code>{account.address}</code>
            <button
              className={`wallet-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyAddress}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>

          <p className="receive-note">
            Only send {account.network.symbol} to this address.<br />
            Sending other assets may result in permanent loss.
          </p>
        </div>
      )}
    </div>
  );
}
