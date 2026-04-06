import React from 'react';
import { Eye, MousePointer, Calendar, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FeaturedBadge } from './FeaturedBadge';

interface Promotion {
  _id: string;
  propertyId: { _id: string; name: string; type: string };
  type: 'featured' | 'boosted' | 'premium';
  startDate: string;
  endDate: string;
  isActive: boolean;
  amount: number;
  impressions: number;
  clicks: number;
}

interface PromotionCardProps {
  promotion: Promotion;
  onCancel?: (id: string) => void;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onCancel }) => {
  const endDate = new Date(promotion.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const ctr = promotion.impressions > 0
    ? ((promotion.clicks / promotion.impressions) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">
            {promotion.propertyId?.name || 'Unknown Property'}
          </h4>
          <FeaturedBadge type={promotion.type} />
        </div>
        <Badge variant={isExpired || !promotion.isActive ? 'danger' : 'success'}>
          {isExpired ? 'Expired' : !promotion.isActive ? 'Cancelled' : `${daysLeft}d left`}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Eye className="h-4 w-4" />
          <span>{promotion.impressions.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MousePointer className="h-4 w-4" />
          <span>{promotion.clicks.toLocaleString()}</span>
        </div>
        <div className="text-sm text-gray-600">
          CTR: {ctr}%
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
        <Calendar className="h-3 w-3" />
        <span>
          {new Date(promotion.startDate).toLocaleDateString()} -{' '}
          {endDate.toLocaleDateString()}
        </span>
      </div>

      {promotion.isActive && !isExpired && onCancel && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCancel(promotion._id)}
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancel Promotion
        </Button>
      )}
    </Card>
  );
};

export default PromotionCard;
