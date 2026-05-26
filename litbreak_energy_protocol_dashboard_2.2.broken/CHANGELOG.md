# LitBreakProtocol Changelog

## v3.1.0 — Codebase Audit & Cleanup (2025)

### Phase 1 — Dead Code Removal
- `src/lib/mockData.ts`: Removed unused named exports `LITECOIN_PRICE_HISTORY`,
  `ENERGY_INDEX_HISTORY`, `HASHRATE_HISTORY` (were never imported anywhere).
- `src/lib/simulationEngine.ts`: Prefixed unused `_type` / `_params` parameters
  with `_` to satisfy `noUnusedParameters`; made `notifyListeners` truly `private`.
- `src/contexts/WalletContext.tsx`: Replaced `err: any` with `err: unknown` +
  type-narrowed extraction — removes implicit `any` dead path.
- `src/types/index.ts`: Changed `provider: any` / `signer: any` to `unknown`
  (dead `any` escape hatch removed).
- `src/components/Dashboard.tsx`: Renamed `showCreateAgent` → `showCreate`
  (internal only; no public API change).

### Phase 2 — Orphaned File Detection
- No orphaned source files found. All components, hooks, contexts, and lib
  modules are reachable from `src/main.tsx` via the import graph.
- `src/context/WalletContext.tsx` (legacy barrel) confirmed intentional —
  retained for backward-compat import path support.

### Phase 3 — Duplicate Consolidation
- **NEW** `src/lib/format.ts`: Canonical formatting utilities extracted from
  inline duplicates across components:
  - `formatCompact()` — was duplicated in EnergyIndex, MiningStats
  - `formatHashrate()` — was duplicated in MiningStats, StatsCards
  - `truncateAddress()` — was duplicated in Header, AirdropClaim, ContractInteraction
  - `formatRelativeTime()` — was duplicated in AgentCard, TransactionToast
  - `formatUSD()` — new shared utility
  - `formatPercent()` — was duplicated in AgentCard, StatsCards
- All call sites updated to import from `src/lib/format.ts`.

### Phase 4 — Directory Structure
- Structure confirmed consistent with layer-based architecture:
  ```
  src/
  ├── App.tsx
  ├── main.tsx
  ├── index.css
  ├── types/index.ts          ← all shared types
  ├── contexts/               ← React context providers (canonical)
  │   ├── Web3Context.tsx
  │   └── WalletContext.tsx
  ├── context/                ← legacy barrel re-exports only
  │   └── WalletContext.tsx
  ├── hooks/                  ← custom React hooks
  │   ├── useAgents.ts
  │   ├── useEnergyIndex.ts
  │   ├── useMiningStats.ts
  │   └── useProtocolStats.ts
  ├── lib/                    ← pure utilities & engines
  │   ├── format.ts           ← NEW (Phase 3 consolidation)
  │   ├── mockData.ts
  │   ├── simulationEngine.ts
  │   └── web3/
  │       ├── config.ts
  │       └── provider.ts
  └── components/             ← React UI components
      ├── Dashboard.tsx
      ├── Header.tsx
      ├── StatsCards.tsx
      ├── ChartViewer.tsx
      ├── EnergyIndex.tsx
      ├── MiningStats.tsx
      ├── MintRedeem.tsx
      ├── AgentCard.tsx
      ├── CreateAgentModal.tsx
      ├── AIAnalysis.tsx
      ├── AirdropClaim.tsx
      ├── LitoshiKwhConverter.tsx
      ├── ContractInteraction.tsx
      ├── NetworkGuard.tsx
      ├── TransactionToast.tsx
      ├── SimulationBadge.tsx
      └── Web3ErrorBoundary.tsx
  ```
- No files relocated (structure was already consistent).

### Phase 5 — Integrity Validation
- `tsconfig.json`: `noUnusedLocals: true`, `noUnusedParameters: true` enabled.
- All components verified to compile under strict TypeScript.
- Build pipeline: `tsc --noEmit && vite build` passes without errors.
- No regressions in component interfaces or exported contracts.

### Risks & Assumptions
- `METHOD_SELECTORS` for `refreshOracleCache` and `setOracleKeeper` in
  `ContractABI.ts` use placeholder values — recompute with actual keccak256
  before mainnet deployment.
- LitVM chainId 1856 (testnet) and 1857 (mainnet) are working assumptions —
  confirm with LitVM team before mainnet launch.
- Oracle feed addresses default to `ZeroAddress` on testnet — register real
  Chainlink-compatible feeds before enabling mint/redeem on mainnet.

---

## v3.0.0 — SWC-114 Fix & Oracle Keeper (2025)
- `contracts/LitBreakProtocol.sol`: FIX-01 through FIX-15 applied.
- `src/lib/ContractABI.ts`: v3.0.0 — refreshOracleCache, setOracleKeeper,
  oracleKeeper, isOracleCacheFresh added.
- `src/lib/web3/contract.ts`: v3.0.0 — all oracle service methods added.
- `src/lib/web3/config.ts`: LitVM Testnet chainId 1856, LTC currency.
- `src/lib/web3/provider.ts`: nativeCurrency from NetworkConfig.
- `scripts/deploy.js`: LitVM targeted, chain ID guard, LTC denomination.
- `hardhat.config.js`: paris EVM, 0.1 gwei gas.

## v2.0.0 — Initial DeFi Dashboard
- Full component set implemented.
- Simulation engine, mock data, agent management.
- Web3 context, wallet context, network switching.
