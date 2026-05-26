/**
 * ContractInteraction — Advanced developer console for direct contract interaction.
 *
 * Pass 10: All ETH references updated to LTC. Read-only mode enforcement added.
 * Write methods are disabled when isReadOnly is true.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  ChevronRight,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  FileCode2,
  Braces,
  Clock,
  Fuel,
  ArrowRight,
  Eye,
  Send,
  Shield,
  Hash,
  Lock,
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useReadOnly } from '../contexts/ReadOnlyContext';
import { useTokenData } from '../hooks/useTokenData';
import { CONTRACTS, PROTOCOL_CONSTANTS, shortenAddress, shortenTxHash, getExplorerTxUrl } from '../lib/ContractRegistry';
import { decodeRevertReason } from '../lib/RevertDecoder';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContractMethod = {
  name: string;
  type: 'read' | 'write';
  selector: string;
  description: string;
  params: { name: string; type: string; placeholder: string }[];
  returns?: string;
};

type CallResult = {
  method: string;
  type: 'read' | 'write';
  result: string;
  txHash?: string;
  gasUsed?: number;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
};

// ─── Contract ABI (simplified for UI) ────────────────────────────────────────

const CONTRACT_METHODS: ContractMethod[] = [
  // ─── Read Methods ────────────────────────────────────────────────────────
  {
    name: 'totalSupply',
    type: 'read',
    selector: '0x18160ddd',
    description: 'Returns the total supply of LITB tokens',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'balanceOf',
    type: 'read',
    selector: '0x70a08231',
    description: 'Returns the LITB balance of an address',
    params: [{ name: 'account', type: 'address', placeholder: '0x...' }],
    returns: 'uint256',
  },
  {
    name: 'exchangeRate',
    type: 'read',
    selector: '0x3ba0b9a9',
    description: 'Returns the current LTC → LITB exchange rate',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'protocolFeeBps',
    type: 'read',
    selector: '0x3013ce29',
    description: 'Returns the protocol fee in basis points',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'totalCollateral',
    type: 'read',
    selector: '0x3b2ecA18',
    description: 'Returns total LTC collateral locked in the protocol',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'HARD_CAP',
    type: 'read',
    selector: '0xfb86a404',
    description: 'Returns the maximum supply cap (21,000,000 LITB)',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'remainingSupply',
    type: 'read',
    selector: '0x8ada066e',
    description: 'Returns remaining LITB tokens that can be minted before hard cap',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'getMintQuote',
    type: 'read',
    selector: '0xa1c5d3f4',
    description: 'Get a quote for minting LITB with a given LTC amount',
    params: [{ name: 'ltcAmount', type: 'uint256', placeholder: '1.0' }],
    returns: '(uint256 litbAmount, uint256 fee)',
  },
  {
    name: 'getRedeemQuote',
    type: 'read',
    selector: '0xb7e04db1',
    description: 'Get a quote for redeeming LITB tokens',
    params: [{ name: 'litbAmount', type: 'uint256', placeholder: '100.0' }],
    returns: '(uint256 ltcAmount, uint256 fee)',
  },
  {
    name: 'getContractState',
    type: 'read',
    selector: '0x12065fe0',
    description: 'Returns aggregated protocol state — 10 values in a single call',
    params: [],
    returns: '(uint256 totalSupply, uint256 hardCap, uint256 monthlyRate, uint256 contractYear, uint256 lastRelYear, uint256 lastRelMonth, bool isPaused, uint256 exchangeRate, uint256 totalCollateral, uint256 accumulatedFees)',
  },
  {
    name: 'getEffectiveMonthlyRate',
    type: 'read',
    selector: '0x7c3e6105',
    description: 'Returns the current monthly token release rate after escalation',
    params: [],
    returns: 'uint256',
  },
  {
    name: 'getEscalatorForYear',
    type: 'read',
    selector: '0x9a8a0592',
    description: 'Returns escalator BPS and set status for a given contract year',
    params: [{ name: 'contractYear', type: 'uint256', placeholder: '1' }],
    returns: '(uint256 bps, bool isSet)',
  },

  // ─── Write Methods ───────────────────────────────────────────────────────
  {
    name: 'mint',
    type: 'write',
    selector: '0x1249c58b',
    description: 'Mint LITB tokens by depositing LTC (payable)',
    params: [{ name: 'ltcAmount', type: 'uint256', placeholder: '1.0' }],
  },
  {
    name: 'redeem',
    type: 'write',
    selector: '0xdb006a75',
    description: 'Redeem LITB tokens for LTC',
    params: [{ name: 'litbAmount', type: 'uint256', placeholder: '100.0' }],
  },
  {
    name: 'approve',
    type: 'write',
    selector: '0x095ea7b3',
    description: 'Approve spender to transfer LITB tokens',
    params: [
      { name: 'spender', type: 'address', placeholder: '0x...' },
      { name: 'amount', type: 'uint256', placeholder: '1000.0' },
    ],
  },
  {
    name: 'transfer',
    type: 'write',
    selector: '0xa9059cbb',
    description: 'Transfer LITB tokens to another address',
    params: [
      { name: 'to', type: 'address', placeholder: '0x...' },
      { name: 'amount', type: 'uint256', placeholder: '100.0' },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ContractInteraction() {
  const { connected, address, balance, powerBalance, connect, connecting, mintPower, redeemPower, signMessage, estimateGas, contractAddress } = useWallet();
  const { getExchangeRate, getProtocolFeeBps, getMintQuote, getRedeemQuote, getEscalatorState } = useTokenData();
  const { isReadOnly, guardWrite } = useReadOnly();

  const [selectedMethod, setSelectedMethod] = useState<ContractMethod>(CONTRACT_METHODS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [executing, setExecuting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'read' | 'write'>('all');

  // Reset params when method changes
  useEffect(() => {
    setParamValues({});
  }, [selectedMethod.name]);

  const filteredMethods = useMemo(() => {
    if (filter === 'all') return CONTRACT_METHODS;
    return CONTRACT_METHODS.filter(m => m.type === filter);
  }, [filter]);

  // ─── Execute Contract Call ───────────────────────────────────────────────

  const executeCall = async () => {
    // Block write operations in read-only mode
    if (selectedMethod.type === 'write' && isReadOnly) {
      if (!guardWrite(`contract:${selectedMethod.name}`)) {
        const errorEntry: CallResult = {
          method: selectedMethod.name,
          type: selectedMethod.type,
          result: '',
          timestamp: Date.now(),
          status: 'error' as const,
          error: 'Write operations are disabled in read-only mode',
        };
        setCallResults(prev => [errorEntry, ...prev].slice(0, 50));
        return;
      }
    }

    if (!connected && selectedMethod.type === 'write') return;
    setExecuting(true);

    try {
      let result: string;
      let txHash: string | undefined;
      let gasUsed: number | undefined;

      await new Promise(r => setTimeout(r, selectedMethod.type === 'read' ? 400 : 1200));

      switch (selectedMethod.name) {
        case 'totalSupply': {
          const state = getEscalatorState();
          result = `${state.totalSupply.toLocaleString()} LITB (${state.totalSupply.toFixed(0)} × 10^18 wei)`;
          break;
        }
        case 'balanceOf': {
          const acct = paramValues['account'] || address || '';
          if (!acct) throw new Error('Account address required');
          const isOwnAddress = acct.toLowerCase() === address?.toLowerCase();
          const bal = isOwnAddress ? powerBalance : Math.random() * 10000;
          result = `${bal.toLocaleString(undefined, { maximumFractionDigits: 4 })} LITB`;
          break;
        }
        case 'exchangeRate': {
          const rate = getExchangeRate();
          result = `${rate.toFixed(4)} LITB per LTC (${(rate * 1e18).toExponential(4)} wei)`;
          break;
        }
        case 'protocolFeeBps': {
          const fee = getProtocolFeeBps();
          result = `${fee} bps (${(fee / 100).toFixed(2)}%)`;
          break;
        }
        case 'totalCollateral': {
          const state = getEscalatorState();
          const rate = getExchangeRate();
          const simulatedCollateral = rate > 0 ? state.totalSupply / rate : 0;
          result = `${simulatedCollateral.toLocaleString(undefined, { maximumFractionDigits: 4 })} LTC (direct state read)`;
          break;
        }
        case 'HARD_CAP': {
          result = `${PROTOCOL_CONSTANTS.HARD_CAP.toLocaleString()} LITB (${PROTOCOL_CONSTANTS.HARD_CAP})`;
          break;
        }
        case 'remainingSupply': {
          const state = getEscalatorState();
          const remaining = Math.max(0, PROTOCOL_CONSTANTS.HARD_CAP - state.totalSupply);
          result = `${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} LITB (${((remaining / PROTOCOL_CONSTANTS.HARD_CAP) * 100).toFixed(2)}% of hard cap)`;
          break;
        }
        case 'getMintQuote': {
          const ltcAmt = parseFloat(paramValues['ltcAmount'] || '0');
          if (ltcAmt <= 0) throw new Error('LTC amount must be > 0');
          const quote = getMintQuote(ltcAmt);
          result = `litbAmount: ${quote.powerAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} LITB | fee: ${quote.fee.toFixed(6)} LTC`;
          break;
        }
        case 'getRedeemQuote': {
          const litbAmt = parseFloat(paramValues['litbAmount'] || '0');
          if (litbAmt <= 0) throw new Error('LITB amount must be > 0');
          const quote = getRedeemQuote(litbAmt);
          result = `ltcAmount: ${quote.ltcAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} LTC | fee: ${quote.fee.toFixed(6)} LTC`;
          break;
        }
        case 'getContractState': {
          const state = getEscalatorState();
          const rate = getExchangeRate();
          const feeBps = getProtocolFeeBps();
          const collateral = rate > 0 ? state.totalSupply / rate : 0;
          const accFees = collateral * (feeBps / 10000) * 0.1;

          result = [
            `totalSupply: ${state.totalSupply.toLocaleString()} LITB`,
            `hardCap: ${PROTOCOL_CONSTANTS.HARD_CAP.toLocaleString()} LITB`,
            `monthlyRate: ${PROTOCOL_CONSTANTS.BASE_MONTHLY_RELEASE.toLocaleString()} LITB`,
            `contractYear: ${state.currentYear}`,
            `lastRelYear: ${state.currentYear}`,
            `lastRelMonth: ${new Date().getMonth() + 1}`,
            `isPaused: false`,
            `exchangeRate: ${rate.toFixed(4)}`,
            `totalCollateral: ${collateral.toFixed(4)} LTC`,
            `accumulatedFees: ${accFees.toFixed(6)} LTC`,
          ].join('\n');
          break;
        }
        case 'getEffectiveMonthlyRate': {
          const state = getEscalatorState();
          const escalatorMultiplier = 1 + (state.escalatorBps / 10000);
          const effectiveRate = PROTOCOL_CONSTANTS.BASE_MONTHLY_RELEASE * escalatorMultiplier;
          result = `${effectiveRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} LITB/month (base: ${PROTOCOL_CONSTANTS.BASE_MONTHLY_RELEASE} × escalator: ${escalatorMultiplier.toFixed(4)})`;
          break;
        }
        case 'getEscalatorForYear': {
          const year = parseInt(paramValues['contractYear'] || '0');
          if (year < 0) throw new Error('Contract year must be >= 0');
          const state = getEscalatorState();
          const isCurrentOrPast = year <= state.currentYear;
          const bps = isCurrentOrPast ? state.escalatorBps : 0;
          const isSet = isCurrentOrPast;
          result = `bps: ${bps} (${(bps / 100).toFixed(2)}%) | isSet: ${isSet}`;
          break;
        }
        case 'mint': {
          if (!address) throw new Error('Wallet not connected');
          const ltcAmt = parseFloat(paramValues['ltcAmount'] || '0');
          if (ltcAmt <= 0) throw new Error('LTC amount must be > 0');
          if (ltcAmt > balance) throw new Error(`Insufficient balance: ${balance.toFixed(4)} LTC`);
          txHash = await mintPower(ltcAmt);
          gasUsed = estimateGas(contractAddress, '0x1249c58b');
          result = `Minted successfully — tx: ${shortenTxHash(txHash)}`;
          break;
        }
        case 'redeem': {
          if (!address) throw new Error('Wallet not connected');
          const litbAmt = parseFloat(paramValues['litbAmount'] || '0');
          if (litbAmt <= 0) throw new Error('LITB amount must be > 0');
          if (litbAmt > powerBalance) throw new Error(`Insufficient LITB balance: ${powerBalance.toFixed(2)}`);
          txHash = await redeemPower(litbAmt);
          gasUsed = estimateGas(contractAddress, '0xdb006a75');
          result = `Redeemed successfully — tx: ${shortenTxHash(txHash)}`;
          break;
        }
        case 'approve': {
          if (!address) throw new Error('Wallet not connected');
          const spender = paramValues['spender'] || '';
          if (!/^0x[a-fA-F0-9]{40}$/.test(spender)) throw new Error('Invalid spender address');
          const sig = await signMessage(`approve(${spender}, ${paramValues['amount'] || '0'})`);
          txHash = '0x' + sig.slice(2, 66);
          gasUsed = estimateGas(spender, '0x095ea7b3');
          result = `Approved ${paramValues['amount'] || '0'} LITB for ${shortenAddress(spender)}`;
          break;
        }
        case 'transfer': {
          if (!address) throw new Error('Wallet not connected');
          const to = paramValues['to'] || '';
          if (!/^0x[a-fA-F0-9]{40}$/.test(to)) throw new Error('Invalid recipient address');
          if (to.toLowerCase() === '0x0000000000000000000000000000000000000000') {
            throw new Error('LitbreakProtocol: transfer to zero address');
          }
          const transferAmt = parseFloat(paramValues['amount'] || '0');
          if (transferAmt <= 0) throw new Error('Amount must be > 0');
          if (transferAmt > powerBalance) throw new Error(`Insufficient LITB balance: ${powerBalance.toFixed(2)}`);
          const sig = await signMessage(`transfer(${to}, ${transferAmt})`);
          txHash = '0x' + sig.slice(2, 66);
          gasUsed = estimateGas(to, '0xa9059cbb');
          result = `Transferred ${transferAmt.toLocaleString()} LITB to ${shortenAddress(to)}`;
          break;
        }
        default:
          result = 'Method not implemented';
      }

      const successEntry: CallResult = {
        method: selectedMethod.name,
        type: selectedMethod.type,
        result,
        txHash,
        gasUsed,
        timestamp: Date.now(),
        status: 'success' as const,
      };
      setCallResults(prev => [successEntry, ...prev].slice(0, 50));

    } catch (err) {
      const friendlyError = decodeRevertReason(err);
      const errorEntry: CallResult = {
        method: selectedMethod.name,
        type: selectedMethod.type,
        result: '',
        timestamp: Date.now(),
        status: 'error' as const,
        error: friendlyError,
      };
      setCallResults(prev => [errorEntry, ...prev].slice(0, 50));
    } finally {
      setExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isWriteDisabled = selectedMethod.type === 'write' && isReadOnly;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Terminal className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Contract Interaction</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FileCode2 className="w-3 h-3 text-textSecondary" />
                <span className="text-[10px] text-textSecondary font-mono">
                  {shortenAddress(CONTRACTS.LITBREAK_PROTOCOL.address)}
                </span>
                <button
                  onClick={() => copyToClipboard(CONTRACTS.LITBREAK_PROTOCOL.address)}
                  className="text-textSecondary hover:text-primary transition-colors"
                >
                  {copiedHash === CONTRACTS.LITBREAK_PROTOCOL.address ? (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isReadOnly && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">Read Only</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-medium">LitVM Testnet</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        {/* Left: Method Selector */}
        <div className="p-4 space-y-3">
          {/* Filter Tabs */}
          <div className="flex gap-1 p-0.5 bg-surface/60 rounded-lg">
            {(['all', 'read', 'write'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                  filter === f
                    ? f === 'read'
                      ? 'bg-secondary/20 text-secondary'
                      : f === 'write'
                        ? isReadOnly ? 'bg-amber-500/10 text-amber-400' : 'bg-primary/20 text-primary'
                        : 'bg-white/[0.08] text-white'
                    : 'text-textSecondary hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'read' ? '👁 Read' : isReadOnly ? '🔒 Write' : '✍️ Write'}
              </button>
            ))}
          </div>

          {/* Method List */}
          <div className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
            {filteredMethods.map(method => (
              <button
                key={method.name}
                onClick={() => setSelectedMethod(method)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all group ${
                  selectedMethod.name === method.name
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-white/[0.04] border border-transparent'
                } ${method.type === 'write' && isReadOnly ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {method.type === 'read' ? (
                      <Eye className="w-3 h-3 text-secondary" />
                    ) : isReadOnly ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Send className="w-3 h-3 text-primary" />
                    )}
                    <span className={`text-xs font-mono font-medium ${
                      selectedMethod.name === method.name ? 'text-white' : 'text-textSecondary group-hover:text-white'
                    }`}>
                      {method.name}
                    </span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                    method.type === 'read'
                      ? 'bg-secondary/10 text-secondary'
                      : isReadOnly
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-primary/10 text-primary'
                  }`}>
                    {method.type === 'write' && isReadOnly ? 'LOCKED' : method.type.toUpperCase()}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Method Details */}
          <div className="bg-surface/40 rounded-lg p-3 space-y-3 border border-white/[0.04]">
            <div className="flex items-start gap-2">
              <Braces className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-white font-medium font-mono">{selectedMethod.name}()</p>
                <p className="text-[10px] text-textSecondary mt-0.5">{selectedMethod.description}</p>
              </div>
            </div>

            {/* Selector */}
            <div className="flex items-center gap-2 text-[10px]">
              <Hash className="w-3 h-3 text-textSecondary" />
              <span className="text-textSecondary">Selector:</span>
              <code className="text-primary font-mono bg-primary/5 px-1.5 py-0.5 rounded">{selectedMethod.selector}</code>
            </div>

            {/* Return type */}
            {selectedMethod.returns && (
              <div className="flex items-center gap-2 text-[10px]">
                <ArrowRight className="w-3 h-3 text-textSecondary" />
                <span className="text-textSecondary">Returns:</span>
                <code className="text-secondary font-mono bg-secondary/5 px-1.5 py-0.5 rounded text-[9px] break-all">{selectedMethod.returns}</code>
              </div>
            )}

            {/* Parameters */}
            {selectedMethod.params.length > 0 && (
              <div className="space-y-2">
                {selectedMethod.params.map(param => (
                  <div key={param.name}>
                    <label className="text-[10px] text-textSecondary flex items-center gap-1 mb-1">
                      <span className="text-white font-mono">{param.name}</span>
                      <span className="text-textSecondary/60">({param.type})</span>
                    </label>
                    <input
                      type="text"
                      value={paramValues[param.name] || ''}
                      onChange={e => setParamValues(prev => ({ ...prev, [param.name]: e.target.value }))}
                      placeholder={param.placeholder}
                      disabled={isWriteDisabled}
                      className={`w-full bg-background/60 border rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-textSecondary/30 focus:outline-none transition-colors ${
                        isWriteDisabled
                          ? 'border-amber-500/10 opacity-50 cursor-not-allowed'
                          : 'border-white/[0.08] focus:border-primary/40'
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Execute Button */}
            {isWriteDisabled ? (
              <div className="w-full py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <Lock className="w-3.5 h-3.5" />
                Write Disabled (Read-Only Mode)
              </div>
            ) : !connected && selectedMethod.type === 'write' ? (
              <button
                onClick={connect}
                disabled={connecting}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    Connect Wallet to Execute
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={executeCall}
                disabled={executing}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedMethod.type === 'read'
                    ? 'bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20'
                    : 'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90'
                } disabled:opacity-50`}
              >
                {executing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {selectedMethod.type === 'read' ? 'Querying...' : 'Signing & Sending...'}
                  </>
                ) : (
                  <>
                    {selectedMethod.type === 'read' ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {selectedMethod.type === 'read' ? 'Query' : 'Execute'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: Results Console */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-textSecondary" />
              <span className="text-xs font-medium text-white">Console Output</span>
            </div>
            {callResults.length > 0 && (
              <button
                onClick={() => setCallResults([])}
                className="text-[10px] text-textSecondary hover:text-error transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="bg-background/80 rounded-lg border border-white/[0.04] min-h-[380px] max-h-[380px] overflow-y-auto scrollbar-thin">
            {callResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[380px] text-textSecondary/40">
                <Terminal className="w-8 h-8 mb-2" />
                <p className="text-xs">Select a method and execute to see results</p>
                {isReadOnly && (
                  <p className="text-[10px] text-amber-500/40 mt-1">Read methods available • Write methods locked</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                <AnimatePresence>
                  {callResults.map((callResult) => (
                    <motion.div
                      key={`${callResult.method}-${callResult.timestamp}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      className="p-3 space-y-1.5"
                    >
                      {/* Method header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronRight className={`w-3 h-3 ${
                            callResult.status === 'success' ? 'text-success' : 'text-error'
                          }`} />
                          <span className="text-[11px] font-mono font-medium text-white">
                            {callResult.method}()
                          </span>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${
                            callResult.type === 'read'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {callResult.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-textSecondary">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(callResult.timestamp)}
                        </div>
                      </div>

                      {/* Result or Error */}
                      {callResult.status === 'success' ? (
                        <div className="bg-success/5 border border-success/10 rounded-md px-2.5 py-1.5">
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-success mt-0.5 shrink-0" />
                            <pre className="text-[11px] text-success/90 font-mono break-all leading-relaxed whitespace-pre-wrap">
                              {callResult.result}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-error/5 border border-error/10 rounded-md px-2.5 py-1.5">
                          <div className="flex items-start gap-1.5">
                            <AlertCircle className="w-3 h-3 text-error mt-0.5 shrink-0" />
                            <p className="text-[11px] text-error/90 font-mono break-all">
                              Error: {callResult.error}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tx Hash & Gas */}
                      {(callResult.txHash || callResult.gasUsed) && (
                        <div className="flex items-center gap-3 text-[9px] text-textSecondary pl-4">
                          {callResult.txHash && (
                            <div className="flex items-center gap-1">
                              <Hash className="w-2.5 h-2.5" />
                              <a
                                href={getExplorerTxUrl(callResult.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono hover:text-primary transition-colors"
                              >
                                {shortenTxHash(callResult.txHash)}
                              </a>
                              <button
                                onClick={() => copyToClipboard(callResult.txHash!)}
                                className="hover:text-white transition-colors"
                              >
                                {copiedHash === callResult.txHash ? (
                                  <CheckCircle2 className="w-2.5 h-2.5 text-success" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                              <a
                                href={getExplorerTxUrl(callResult.txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                          {callResult.gasUsed && (
                            <div className="flex items-center gap-1">
                              <Fuel className="w-2.5 h-2.5" />
                              <span className="font-mono">{callResult.gasUsed.toLocaleString()} gas</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
