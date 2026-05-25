import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import type { Agent } from '../types/utx';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const riskColors = {
    low: 'text-success bg-success/10 border-success/20',
    medium: 'text-warning bg-warning/10 border-warning/20',
    high: 'text-error bg-error/10 border-error/20',
  };

  const statusColors = {
    active: 'text-success',
    paused: 'text-warning',
    stopped: 'text-error',
  };

  return (
    <motion.div
      onClick={onClick}
      className="glass-card p-5 cursor-pointer hover:border-white/10 transition-all group"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{agent.name}</h3>
          <p className="text-xs text-textSecondary mt-0.5 line-clamp-1">{agent.description}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${riskColors[agent.riskLevel]}`}>
          {agent.riskLevel.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-success" />
          <span className="text-xs text-textSecondary">ROI</span>
          <span className="text-xs font-mono font-semibold text-success ml-auto">+{agent.performance.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3 h-3 text-secondary" />
          <span className="text-xs text-textSecondary">TVL</span>
          <span className="text-xs font-mono font-semibold text-white ml-auto">${(agent.tvl / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-primary" />
          <span className="text-xs text-textSecondary">Followers</span>
          <span className="text-xs font-mono font-semibold text-white ml-auto">{agent.followers}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          <span className="text-xs text-textSecondary">Status</span>
          <span className={`text-xs font-semibold ml-auto capitalize ${statusColors[agent.status]}`}>{agent.status}</span>
        </div>
      </div>
    </motion.div>
  );
}
