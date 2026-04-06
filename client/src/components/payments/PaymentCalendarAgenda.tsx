import { format, parseISO, isToday, isPast, isFuture } from 'date-fns';
import { CalendarIcon, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import { CalendarDay } from '../../types';

interface PaymentCalendarAgendaProps {
  payments: CalendarDay[];
  onPaymentClick?: (payment: CalendarDay) => void;
}

export default function PaymentCalendarAgenda({
  payments,
  onPaymentClick,
}: PaymentCalendarAgendaProps) {
  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  // Group payments by date
  const groupedPayments = payments.reduce((groups, payment) => {
    const date = format(parseISO(payment.dueDate), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(payment);
    return groups;
  }, {} as Record<string, CalendarDay[]>);

  // Sort dates
  const sortedDates = Object.keys(groupedPayments).sort();

  const getDateStatus = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'past';
    return 'future';
  };

  const getIndicatorColor = (indicator: string) => {
    switch (indicator) {
      case 'green':
        return 'text-green-500 bg-green-50';
      case 'red':
        return 'text-red-500 bg-red-50';
      case 'yellow':
        return 'text-yellow-500 bg-yellow-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string, indicator: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (indicator === 'red') return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <CalendarIcon className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-lg font-medium">No payments scheduled</p>
        <p className="text-sm mt-1">Payments for this month will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const dateStatus = getDateStatus(dateStr);
        const date = parseISO(dateStr);
        const datePayments = groupedPayments[dateStr];

        return (
          <div key={dateStr}>
            {/* Date header */}
            <div
              className={`flex items-center gap-2 mb-3 ${
                dateStatus === 'today' ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {format(date, 'EEEE, MMMM d, yyyy')}
                {isToday(date) && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                    Today
                  </span>
                )}
              </span>
            </div>

            {/* Payments list */}
            <div className="space-y-3 pl-6">
              {datePayments.map((payment) => (
                <div
                  key={payment._id}
                  onClick={() => onPaymentClick?.(payment)}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg border cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  {/* Status icon */}
                  <div className={`p-2 rounded-full ${getIndicatorColor(payment.indicator)}`}>
                    {getStatusIcon(payment.status, payment.indicator)}
                  </div>

                  {/* Payment details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">{payment.type}</span>
                      <Badge
                        variant={
                          payment.status === 'completed'
                            ? 'success'
                            : payment.indicator === 'red'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {payment.status === 'completed'
                          ? 'Paid'
                          : payment.indicator === 'red'
                          ? 'Overdue'
                          : 'Pending'}
                      </Badge>
                    </div>
                    {payment.propertyName && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {payment.propertyName}
                        {payment.unitNumber && ` - Unit ${payment.unitNumber}`}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                    {payment.paidAt && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Paid {format(parseISO(payment.paidAt), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
