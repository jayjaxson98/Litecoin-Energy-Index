/**
 * CollectionStats — Displays collection statistics and metrics.
 * Shows floor price, volume, holders, and total supply for a collection.
 */

import { motion } from 'framer-motion';
import { Users, Package, DollarSign, BarChart3 } from 'lucide-react';
import type { Collection } from '../types/utx';

// ─── Props ───────────────────────────────────────────────────────────────────

interface CollectionStatsProps {
  collection: Collection;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CollectionStats({ collection, className = '' }: CollectionStatsProps) {
  const stats = [
    {
      label: 'Floor Price',
      value: `${collection.floorPrice.toFixed(4)} LTC`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '24h Volume',
      value: `${collection.volume24h.toLocaleString()} LTC`,
      icon: BarChart3,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Total Supply',
      value: collection.totalSupply.toLocaleString(),
      icon: Package,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Holders',
      value: collection.holders.toLocaleString(),
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {collection.imageUrl && (
            <img
              src={collection.imageUrl}
              alt={collection.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">{collection.name}</h3>
              {collection.verified && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/10 text-success font-medium">
                  Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-textSecondary mt-0.5 truncate">{collection.description}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-background/60 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={`w-5 h-5 rounded-md ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
              </div>
              <span className="text-[10px] text-textSecondary">{stat.label}</span>
            </div>
            <p className="text-sm font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
