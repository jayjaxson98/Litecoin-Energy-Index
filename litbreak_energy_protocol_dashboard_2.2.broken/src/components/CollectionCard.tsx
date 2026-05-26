import { motion } from 'framer-motion';
import { BadgeCheck, TrendingUp } from 'lucide-react';
import type { Collection } from '../types/utx';

interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className="glass-card overflow-hidden cursor-pointer group hover:border-white/10 transition-all"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Banner image */}
      <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
        {collection.imageUrl && (
          <img
            src={collection.imageUrl}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-bold text-white truncate">{collection.name}</h3>
          {collection.verified && (
            <BadgeCheck className="w-4 h-4 text-secondary flex-shrink-0" />
          )}
        </div>

        <p className="text-xs text-textSecondary line-clamp-2 mb-3">{collection.description}</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-textSecondary">Floor</div>
            <div className="text-xs font-mono font-semibold text-white">
              {collection.floorPrice} LTC
            </div>
          </div>
          <div>
            <div className="text-[10px] text-textSecondary">24h Vol</div>
            <div className="text-xs font-mono font-semibold text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {collection.volume24h} LTC
            </div>
          </div>
          {collection.items !== undefined && (
            <div>
              <div className="text-[10px] text-textSecondary">Items</div>
              <div className="text-xs font-mono text-white">
                {collection.items.toLocaleString()}
              </div>
            </div>
          )}
          {collection.owners !== undefined && (
            <div>
              <div className="text-[10px] text-textSecondary">Owners</div>
              <div className="text-xs font-mono text-white">
                {collection.owners.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
