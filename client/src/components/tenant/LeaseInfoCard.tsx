import React from 'react';
import { Calendar, FileText, Home } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Tenant } from '../../types';

interface LeaseInfoCardProps {
  tenant: Tenant;
}

export const LeaseInfoCard: React.FC<LeaseInfoCardProps> = ({ tenant }) => {
  const lease = tenant.leaseAgreement;
  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const now = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Lease Information</h3>
        <Badge
          variant={isExpired ? 'danger' : isExpiringSoon ? 'warning' : 'success'}
        >
          {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : tenant.status}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Home className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Property / Unit</p>
            <p className="text-sm font-medium">
              {typeof tenant.propertyId === 'object' ? tenant.propertyId.name : 'N/A'} -{' '}
              Unit {typeof tenant.unitId === 'object' ? tenant.unitId.unitNumber : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Lease Period</p>
            <p className="text-sm font-medium">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">
              {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Lease Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-yellow-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500">Monthly Rent</p>
            <p className="text-sm font-bold">{lease.monthlyRent.toLocaleString()} ETB</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Deposit</p>
            <p className="text-sm font-bold">{lease.deposit.toLocaleString()} ETB</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LeaseInfoCard;
