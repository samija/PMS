import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import Badge from '../ui/Badge';
import { CalendarDay } from '../../types';

interface PaymentCalendarWeekViewProps {
  currentDate: Date;
  payments: Record<number, CalendarDay[]>;
  onPaymentClick?: (payment: CalendarDay) => void;
}

export default function PaymentCalendarWeekView({
  currentDate,
  payments,
  onPaymentClick,
}: PaymentCalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getIndicatorColor = (indicator: string) => {
    switch (indicator) {
      case 'green':
        return 'bg-green-500';
      case 'red':
        return 'bg-red-500';
      case 'yellow':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-7 gap-2 min-h-[400px]">
      {weekDays.map((day) => {
        const dayOfMonth = day.getDate();
        const dayPayments = payments[dayOfMonth] || [];
        const isCurrentDay = isToday(day);
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();

        return (
          <div
            key={day.toISOString()}
            className={`border rounded-lg overflow-hidden ${
              isCurrentDay ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200'
            } ${!isCurrentMonth ? 'opacity-50' : ''}`}
          >
            {/* Day header */}
            <div
              className={`px-2 py-1.5 text-center border-b ${
                isCurrentDay ? 'bg-primary-100' : 'bg-gray-50'
              }`}
            >
              <p className="text-xs text-gray-500">{format(day, 'EEE')}</p>
              <p
                className={`text-lg font-semibold ${
                  isCurrentDay ? 'text-primary-600' : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </p>
            </div>

            {/* Payments list */}
            <div className="p-2 space-y-2 max-h-72 overflow-y-auto">
              {dayPayments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No payments</p>
              ) : (
                dayPayments.map((payment) => (
                  <div
                    key={payment._id}
                    onClick={() => onPaymentClick?.(payment)}
                    className="p-2 bg-white rounded border cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${getIndicatorColor(
                          payment.indicator
                        )}`}
                      />
                      <span className="text-xs font-medium text-gray-900 capitalize truncate">
                        {payment.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    {payment.propertyName && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {payment.propertyName}
                      </p>
                    )}
                    <Badge
                      variant={
                        payment.status === 'completed'
                          ? 'success'
                          : payment.indicator === 'red'
                          ? 'danger'
                          : 'warning'
                      }
                      className="mt-1"
                    >
                      {payment.status === 'completed'
                        ? 'Paid'
                        : payment.indicator === 'red'
                        ? 'Overdue'
                        : 'Pending'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
