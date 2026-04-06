import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Payment } from '../../types';

interface RentSummaryCardProps {
  payments: Payment[];
  monthlyRent: number;
}

export const RentSummaryCard: React.FC<RentSummaryCardProps> = ({ payments, monthlyRent }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const thisMonthPayment = payments.find(
    (p) => p.month === currentMonth && p.year === currentYear && p.type === 'rent'
  );

  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const isPaid = thisMonthPayment?.status === 'completed';

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rent Summary</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="text-lg font-bold">{monthlyRent.toLocaleString()} ETB</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
            {isPaid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">This Month</p>
            <p className={`text-lg font-bold ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
              {isPaid ? 'Paid' : 'Pending'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-lg font-bold">{totalPaid.toLocaleString()} ETB</p>
          </div>
        </div>

        {pendingAmount > 0 && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-lg font-bold text-red-600">{pendingAmount.toLocaleString()} ETB</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RentSummaryCard;
