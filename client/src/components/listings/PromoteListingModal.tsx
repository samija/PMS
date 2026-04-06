import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Zap, Crown } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { promotionAPI } from '../../services/api';

interface PromoteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

const promotionTypes = [
  {
    type: 'boosted' as const,
    label: 'Boosted',
    price: 300,
    icon: Zap,
    color: 'border-blue-300 bg-blue-50',
    description: 'Higher visibility in search results',
  },
  {
    type: 'featured' as const,
    label: 'Featured',
    price: 500,
    icon: Star,
    color: 'border-yellow-300 bg-yellow-50',
    description: 'Featured badge + top placement',
  },
  {
    type: 'premium' as const,
    label: 'Premium',
    price: 1000,
    icon: Crown,
    color: 'border-purple-300 bg-purple-50',
    description: 'Premium badge + homepage spotlight',
  },
];

export const PromoteListingModal: React.FC<PromoteListingModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyName,
}) => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<'featured' | 'boosted' | 'premium'>('featured');
  const [duration, setDuration] = useState(30);

  const createPromotion = useMutation({
    mutationFn: async () => {
      return promotionAPI.create({
        propertyId,
        type: selectedType,
        durationDays: duration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onClose();
    },
  });

  const selectedPlan = promotionTypes.find((p) => p.type === selectedType)!;
  const totalPrice = selectedPlan.price * (duration / 30);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Promote: ${propertyName}`}>
      <div className="space-y-4">
        {/* Promotion Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Promotion Type</label>
          <div className="grid grid-cols-3 gap-3">
            {promotionTypes.map((plan) => {
              const Icon = plan.icon;
              return (
                <button
                  key={plan.type}
                  onClick={() => setSelectedType(plan.type)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedType === plan.type
                      ? `${plan.color} border-current`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm font-medium">{plan.label}</p>
                  <p className="text-xs text-gray-500">{plan.price} ETB/mo</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">{selectedPlan.description}</p>
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-medium text-gray-700">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={7}>1 Week</option>
            <option value={14}>2 Weeks</option>
            <option value={30}>1 Month</option>
            <option value={90}>3 Months</option>
          </select>
        </div>

        {/* Total */}
        <Card className="p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Cost</span>
            <span className="text-xl font-bold">{Math.round(totalPrice).toLocaleString()} ETB</span>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => createPromotion.mutate()}
            disabled={createPromotion.isPending}
          >
            {createPromotion.isPending ? 'Processing...' : 'Promote Listing'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PromoteListingModal;
