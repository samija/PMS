import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, CreditCard, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { calendarAPI } from '../../services/api';
import type { PaymentReminder } from '../../types';

interface PaymentRemindersProps {
  onPayNow?: (paymentId: string) => void;
  limit?: number;
  showTitle?: boolean;
}

export default function PaymentReminders({
  onPayNow,
  limit = 5,
  showTitle = true,
}: PaymentRemindersProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-reminders'],
    queryFn: () => calendarAPI.getPaymentReminders(),
  });

  const reminders = data?.data?.data || { upcoming: [], overdue: [] };
  const { upcoming, overdue } = reminders;

  if (isLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      </Card>
    );
  }

  const hasReminders = upcoming.length > 0 || overdue.length > 0;

  if (!hasReminders) {
    return (
      <Card>
        {showTitle && (
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Reminders</h3>
          </div>
        )}
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No upcoming payments at this time.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      {showTitle && (
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Reminders</h3>
          </div>
          {(upcoming.length + overdue.length) > limit && (
            <Badge variant="info">{upcoming.length + overdue.length} total</Badge>
          )}
        </div>
      )}

      <div className="divide-y">
        {/* Overdue Payments */}
        {overdue.length > 0 && (
          <div className="bg-red-50">
            <div className="px-4 py-2 border-b border-red-100">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Overdue ({overdue.length})
                </span>
              </div>
            </div>
            {overdue.slice(0, limit).map((payment: PaymentReminder) => (
              <ReminderItem
                key={payment._id}
                payment={payment}
                onPayNow={onPayNow}
                variant="overdue"
              />
            ))}
          </div>
        )}

        {/* Upcoming Payments */}
        {upcoming.length > 0 && (
          <div>
            {overdue.length > 0 && (
              <div className="px-4 py-2 border-b bg-gray-50">
                <span className="text-sm font-medium text-gray-600">
                  Upcoming ({upcoming.length})
                </span>
              </div>
            )}
            {upcoming.slice(0, limit - overdue.slice(0, limit).length).map((payment: PaymentReminder) => (
              <ReminderItem
                key={payment._id}
                payment={payment}
                onPayNow={onPayNow}
                variant={payment.daysUntilDue <= 3 ? 'warning' : 'normal'}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

interface ReminderItemProps {
  payment: PaymentReminder;
  onPayNow?: (paymentId: string) => void;
  variant: 'overdue' | 'warning' | 'normal';
}

function ReminderItem({ payment, onPayNow, variant }: ReminderItemProps) {
  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  const getDaysText = (days: number, isOverdue: boolean) => {
    if (isOverdue) {
      return `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`;
    }
    if (days === 0) {
      return 'Due today';
    }
    if (days === 1) {
      return 'Due tomorrow';
    }
    return `Due in ${days} days`;
  };

  const bgColor = {
    overdue: 'hover:bg-red-100',
    warning: 'hover:bg-yellow-50',
    normal: 'hover:bg-gray-50',
  }[variant];

  const textColor = {
    overdue: 'text-red-700',
    warning: 'text-yellow-700',
    normal: 'text-gray-600',
  }[variant];

  return (
    <div className={`p-4 ${bgColor} transition-colors`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-900 capitalize">
              {payment.type} Payment
            </p>
            <Badge
              variant={variant === 'overdue' ? 'danger' : variant === 'warning' ? 'warning' : 'default'}
            >
              {getDaysText(payment.daysUntilDue, payment.isOverdue)}
            </Badge>
          </div>
          {payment.propertyName && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {payment.propertyName} - Unit {payment.unitNumber}
            </p>
          )}
          <p className={`text-xs mt-1 ${textColor}`}>
            {new Date(payment.dueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
            {formatCurrency(payment.amount)}
          </p>
          {onPayNow && (
            <Button
              size="sm"
              variant={variant === 'overdue' ? 'danger' : 'primary'}
              onClick={() => onPayNow(payment._id)}
              className="flex items-center space-x-1"
            >
              <span>Pay</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
