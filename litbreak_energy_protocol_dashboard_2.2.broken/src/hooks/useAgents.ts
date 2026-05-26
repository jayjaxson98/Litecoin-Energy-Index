import { useState, useCallback } from 'react';
import type { AgentConfig } from '../types';

const INITIAL_AGENTS: AgentConfig[] = [
  {
    id: 'agent-1',
    name: 'LTC Momentum Alpha',
    strategy: 'momentum',
    status: 'active',
    pnl: 12.45,
    trades: 847,
    uptime: 99.2,
    allocation: 2500,
    riskLevel: 'medium',
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'agent-2',
    name: 'Energy Arb Bot',
    strategy: 'arbitrage',
    status: 'active',
    pnl: 8.32,
    trades: 1203,
    uptime: 97.8,
    allocation: 5000,
    riskLevel: 'low',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'agent-3',
    name: 'Grid Trader v2',
    strategy: 'grid',
    status: 'paused',
    pnl: -2.1,
    trades: 312,
    uptime: 85.4,
    allocation: 1000,
    riskLevel: 'high',
    createdAt: Date.now() - 86400000 * 7,
  },
];

export function useAgents() {
  const [agents, setAgents] = useState<AgentConfig[]>(INITIAL_AGENTS);
  const [isCreating, setIsCreating] = useState(false);

  const createAgent = useCallback(
    async (config: Omit<AgentConfig, 'id' | 'pnl' | 'trades' | 'uptime' | 'createdAt'>) => {
      setIsCreating(true);
      await new Promise(r => setTimeout(r, 1500));
      const newAgent: AgentConfig = {
        ...config,
        id: `agent-${Date.now()}`,
        pnl: 0,
        trades: 0,
        uptime: 100,
        createdAt: Date.now(),
      };
      setAgents(prev => [...prev, newAgent]);
      setIsCreating(false);
      return newAgent;
    },
    [],
  );

  const toggleAgent = useCallback((id: string) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
          : a,
      ),
    );
  }, []);

  const deleteAgent = useCallback((id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
  }, []);

  return { agents, isCreating, createAgent, toggleAgent, deleteAgent };
}
