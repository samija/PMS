import React from 'react';
import { Star, Zap, Crown } from 'lucide-react';

interface FeaturedBadgeProps {
  type: 'featured' | 'boosted' | 'premium';
  size?: 'sm' | 'md';
}

const badgeConfig = {
  featured: {
    icon: Star,
    label: 'Featured',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  boosted: {
    icon: Zap,
    label: 'Boosted',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  premium: {
    icon: Crown,
    label: 'Premium',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
};

export const FeaturedBadge: React.FC<FeaturedBadgeProps> = ({ type, size = 'sm' }) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.className} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {config.label}
    </span>
  );
};

export default FeaturedBadge;
