import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, CalendarDays } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { calendarAPI } from '../../services/api';
import { CalendarView, CalendarFilter, CalendarDay } from '../../types';
import PaymentCalendarFilters from './PaymentCalendarFilters';
import PaymentCalendarWeekView from './PaymentCalendarWeekView';
import PaymentCalendarAgenda from './PaymentCalendarAgenda';

interface PaymentCalendarProps {
  onPaymentSelect?: (payment: CalendarDay) => void;
  properties?: { _id: string; name: string }[];
  tenants?: { _id: string; name: string }[];
  isOwner?: boolean;
  showFilters?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PaymentCalendar({
  onPaymentSelect,
  properties = [],
  tenants = [],
  isOwner = false,
  showFilters = true,
}: PaymentCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [view, setView] = useState<CalendarView>('month');
  const [filters, setFilters] = useState<CalendarFilter>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-calendar', currentDate.year, currentDate.month, filters],
    queryFn: () => calendarAPI.getPaymentCalendar({ year: currentDate.year, month: currentDate.month }),
  });

  const calendarData = data?.data?.data?.days || {};
  const allPayments = data?.data?.data?.payments || [];

  // Apply filters to payments
  const filteredPayments = allPayments.filter((payment: CalendarDay) => {
    if (filters.type && payment.type !== filters.type) return false;
    if (filters.status && payment.status !== filters.status) return false;
    return true;
  });

  // Build filtered calendar data
  const filteredCalendarData: Record<number, CalendarDay[]> = {};
  Object.keys(calendarData).forEach((day) => {
    const dayNum = parseInt(day);
    const filtered = calendarData[dayNum].filter((payment: CalendarDay) => {
      if (filters.type && payment.type !== filters.type) return false;
      if (filters.status && payment.status !== filters.status) return false;
      return true;
    });
    if (filtered.length > 0) {
      filteredCalendarData[dayNum] = filtered;
    }
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      if (direction === 'prev') {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 };
        }
        return { ...prev, month: prev.month - 1 };
      } else {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 };
        }
        return { ...prev, month: prev.month + 1 };
      }
    });
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    });
    setSelectedDay(null);
  };

  // Get days in month
  const daysInMonth = new Date(currentDate.year, currentDate.month, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.year, currentDate.month - 1, 1).getDay();

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getIndicatorColor = (indicator: string) => {
    switch (indicator) {
      case 'green': return 'bg-green-500';
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const formatCurrency = (amount: number) => `ETB ${amount.toLocaleString()}`;

  const handleDayClick = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.month === today.getMonth() + 1 &&
      currentDate.year === today.getFullYear()
    );
  };

  const currentDateObj = new Date(currentDate.year, currentDate.month - 1, today.getDate());

  return (
    <Card padding="none">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Payment Calendar</h3>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'month' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Month view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('week')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'week' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Week view"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('agenda')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'agenda' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Agenda view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
              {MONTH_NAMES[currentDate.month - 1]} {currentDate.year}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="border-b">
          <PaymentCalendarFilters
            filters={filters}
            onFilterChange={setFilters}
            properties={properties}
            tenants={tenants}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-b flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-gray-600">Paid</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="text-gray-600">Pending</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-gray-600">Overdue</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-3 rounded-full bg-gray-300"></span>
          <span className="text-gray-600">Future</span>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : view === 'week' ? (
          <PaymentCalendarWeekView
            currentDate={currentDateObj}
            payments={filteredCalendarData}
            onPaymentClick={onPaymentSelect}
          />
        ) : view === 'agenda' ? (
          <PaymentCalendarAgenda
            payments={filteredPayments}
            onPaymentClick={onPaymentSelect}
          />
        ) : (
          <>
            {/* Month view - Day names header */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-12" />;
                }

                const dayPayments = filteredCalendarData[day] || [];
                const hasPayments = dayPayments.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => hasPayments && handleDayClick(day)}
                    className={`
                      h-10 sm:h-12 rounded-lg relative flex flex-col items-center justify-center
                      transition-colors min-w-[36px] sm:min-w-[44px]
                      ${isToday(day) ? 'bg-primary-50 border-2 border-primary-500' : ''}
                      ${selectedDay === day ? 'bg-gray-100' : ''}
                      ${hasPayments ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
                    `}
                  >
                    <span className={`text-sm ${isToday(day) ? 'font-bold text-primary-600' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    {hasPayments && (
                      <div className="flex space-x-0.5 mt-1">
                        {dayPayments.slice(0, 3).map((payment: CalendarDay, i: number) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${getIndicatorColor(payment.indicator)}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day details */}
            {selectedDay !== null && filteredCalendarData[selectedDay] && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  Payments on {MONTH_NAMES[currentDate.month - 1]} {selectedDay}
                </h4>
                <div className="space-y-2">
                  {filteredCalendarData[selectedDay].map((payment: CalendarDay) => (
                    <div
                      key={payment._id}
                      onClick={() => onPaymentSelect?.(payment)}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-lg border cursor-pointer hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${getIndicatorColor(payment.indicator)}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{payment.type}</p>
                          {payment.propertyName && (
                            <p className="text-xs text-gray-500">
                              {payment.propertyName} - Unit {payment.unitNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2 pl-6 sm:pl-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Badge variant={payment.status === 'completed' ? 'success' : payment.indicator === 'red' ? 'danger' : 'warning'}>
                          {payment.status === 'completed' ? 'Paid' : payment.indicator === 'red' ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
