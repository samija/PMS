import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calendarAPI } from '../services/api';
import type { CalendarView, CalendarFilter, CalendarDay } from '../types';

export function usePaymentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [filters, setFilters] = useState<CalendarFilter>({});

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['payment-calendar', month, year, filters],
    queryFn: async () => {
      const response = await calendarAPI.getPaymentCalendar({ month, year });
      return response.data?.data || [];
    },
  });

  const payments: CalendarDay[] = calendarData || [];

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: number; payments: CalendarDay[]; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevLastDay = new Date(year, month - 1, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ date: prevLastDay - i, payments: [], isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      const dayPayments = payments.filter((p) => {
        const due = new Date(p.dueDate);
        return due.getDate() === d && due.getMonth() + 1 === month && due.getFullYear() === year;
      });
      days.push({ date: d, payments: dayPayments, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: i, payments: [], isCurrentMonth: false });
    }

    return days;
  }, [payments, month, year]);

  return {
    currentDate,
    view,
    setView,
    filters,
    setFilters,
    payments,
    calendarDays,
    isLoading,
    navigateMonth,
    goToToday,
    month,
    year,
  };
}

export default usePaymentCalendar;
