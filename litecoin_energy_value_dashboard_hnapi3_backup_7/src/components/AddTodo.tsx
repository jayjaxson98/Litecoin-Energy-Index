import React, { useState } from 'react';

// ─── Inline SVG icons (no external dependency) ───────────────────────────────

const PlusIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const BellIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const XIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertCondition = 'above' | 'below';
export type AlertType = 'price' | 'energy-index' | 'kwh-per-ltc';

export interface PriceAlert {
  id: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: number;
  label: string;
  createdAt: number;
  triggered: boolean;
}

interface AddAlertProps {
  onAdd?: (alert: PriceAlert) => void;
  currentLtcPrice?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddAlert: React.FC<AddAlertProps> = ({ onAdd, currentLtcPrice = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('price');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [threshold, setThreshold] = useState('');
  const [label, setLabel] = useState('');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [error, setError] = useState('');

  const typeLabels: Record<AlertType, string> = {
    'price': 'LTC Price (USD)',
    'energy-index': 'Litoshi / kWh',
    'kwh-per-ltc': 'kWh per LTC',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(threshold);
    if (isNaN(val) || val <= 0) {
      setError('Enter a valid positive number.');
      return;
    }

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      type: alertType,
      condition,
      threshold: val,
      label: label.trim() || `${typeLabels[alertType]} ${condition} ${val}`,
      createdAt: Date.now(),
      triggered: false,
    };

    setAlerts(prev => [newAlert, ...prev]);
    onAdd?.(newAlert);
    setThreshold('');
    setLabel('');
    setIsOpen(false);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: '#1e1e2e',
    border: '1px solid #2f2f4a',
    borderRadius: '12px',
    padding: '16px',
    fontFamily: 'Inter, sans-serif',
  };

  const triggerBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #9e7fff 0%, #7c5fe6 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 14px',
    transition: 'opacity 0.15s',
    width: '100%',
    justifyContent: 'center',
  };

  const labelStyle: React.CSSProperties = {
    color: '#a3a3a3',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    background: '#12121e',
    border: '1px solid #2f2f4a',
    borderRadius: '7px',
    color: '#fff',
    fontSize: '13px',
    padding: '8px 10px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
  };

  const submitBtnStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #9e7fff 0%, #7c5fe6 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '9px 0',
    width: '100%',
    marginTop: '4px',
    transition: 'opacity 0.15s',
  };

  const alertRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#12121e',
    border: '1px solid #2f2f4a',
    borderRadius: '8px',
    padding: '8px 10px',
    marginTop: '8px',
  };

  const badgeStyle = (triggered: boolean): React.CSSProperties => ({
    background: triggered ? '#10b981' : '#9e7fff22',
    border: `1px solid ${triggered ? '#10b981' : '#9e7fff55'}`,
    borderRadius: '4px',
    color: triggered ? '#fff' : '#9e7fff',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: '2px 6px',
    textTransform: 'uppercase',
  });

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellIcon size={15} color="#9e7fff" />
          <span style={{ color: '#e2e2f0', fontSize: '13px', fontWeight: 600 }}>Price Alerts</span>
          {alerts.length > 0 && (
            <span style={{
              background: '#9e7fff',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
            }}>
              {alerts.length}
            </span>
          )}
        </div>
        {currentLtcPrice > 0 && (
          <span style={{ color: '#a3a3a3', fontSize: '11px' }}>
            LTC ${currentLtcPrice.toFixed(2)}
          </span>
        )}
      </div>

      {/* Trigger button */}
      {!isOpen && (
        <button style={triggerBtnStyle} onClick={() => setIsOpen(true)}>
          <PlusIcon size={14} color="#fff" />
          Add Alert
        </button>
      )}

      {/* Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Alert type */}
          <div>
            <label style={labelStyle}>Alert Type</label>
            <select
              style={selectStyle}
              value={alertType}
              onChange={e => setAlertType(e.target.value as AlertType)}
            >
              <option value="price">LTC Price (USD)</option>
              <option value="energy-index">Litoshi / kWh</option>
              <option value="kwh-per-ltc">kWh per LTC</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label style={labelStyle}>Condition</label>
            <select
              style={selectStyle}
              value={condition}
              onChange={e => setCondition(e.target.value as AlertCondition)}
            >
              <option value="above">Goes Above</option>
              <option value="below">Falls Below</option>
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label style={labelStyle}>Threshold</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="any"
              placeholder={alertType === 'price' ? 'e.g. 120.00' : alertType === 'energy-index' ? 'e.g. 50000' : 'e.g. 200'}
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              required
            />
          </div>

          {/* Optional label */}
          <div>
            <label style={labelStyle}>Label (optional)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="My alert…"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={60}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setError(''); }}
              style={{
                background: 'transparent',
                border: '1px solid #2f2f4a',
                borderRadius: '8px',
                color: '#a3a3a3',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '9px 0',
                flex: 1,
              }}
            >
              Cancel
            </button>
            <button type="submit" style={{ ...submitBtnStyle, flex: 2, marginTop: 0 }}>
              Create Alert
            </button>
          </div>
        </form>
      )}

      {/* Alert list */}
      {alerts.length > 0 && !isOpen && (
        <div style={{ marginTop: '8px' }}>
          {alerts.map(alert => (
            <div key={alert.id} style={alertRowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e2e2f0', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {alert.label}
                </div>
                <div style={{ color: '#a3a3a3', fontSize: '11px', marginTop: '2px' }}>
                  {typeLabels[alert.type]} · {alert.condition} {alert.threshold.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px', flexShrink: 0 }}>
                <span style={badgeStyle(alert.triggered)}>
                  {alert.triggered ? 'Triggered' : 'Active'}
                </span>
                <button
                  onClick={() => removeAlert(alert.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3', padding: '2px', display: 'flex', alignItems: 'center' }}
                  title="Remove alert"
                >
                  <XIcon size={13} color="#a3a3a3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddAlert;
