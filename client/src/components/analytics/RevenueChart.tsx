import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Card from '../ui/Card';
import { paymentAPI } from '../../services/api';

interface MonthlyData {
  month: number;
  total: number;
  count: number;
}

interface RevenueChartProps {
  className?: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function RevenueChart({ className = '' }: RevenueChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-stats', selectedYear],
    queryFn: () => paymentAPI.getStats(selectedYear),
  });

  const stats = data?.data?.data || {};
  const monthlyData: MonthlyData[] = stats.monthlyBreakdown || [];
  const yearTotal = stats.summary?.find((s: { _id: string; total: number }) => s._id === 'completed')?.total || 0;
  const previousYearTotal = stats.previousYearTotal || 0;

  // Calculate max value for chart scaling
  const maxValue = Math.max(...monthlyData.map(d => d.total), 1);

  // Calculate year-over-year growth
  const growth = previousYearTotal > 0
    ? ((yearTotal - previousYearTotal) / previousYearTotal) * 100
    : 0;

  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
    setHoveredMonth(null);
  };

  // Generate monthly data for all 12 months
  const fullYearData = MONTH_NAMES.map((_, index) => {
    const monthData = monthlyData.find(d => d.month === index + 1);
    return {
      month: index + 1,
      total: monthData?.total || 0,
      count: monthData?.count || 0,
    };
  });

  const currentMonth = new Date().getMonth();
  const isCurrentYear = selectedYear === currentYear;

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <p className="text-sm text-gray-500">Monthly revenue breakdown</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateYear('prev')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {selectedYear}
          </span>
          <button
            onClick={() => navigateYear('next')}
            disabled={selectedYear >= currentYear}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Year Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">{yearTotal.toLocaleString()} ETB</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Year-over-Year</p>
          <div className="flex items-center gap-2">
            <p className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </p>
            {growth >= 0 ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="relative">
            {/* Hovered month tooltip */}
            {hoveredMonth !== null && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm z-10">
                <p className="font-medium">{FULL_MONTH_NAMES[hoveredMonth]}</p>
                <p>{fullYearData[hoveredMonth].total.toLocaleString()} ETB</p>
                <p className="text-gray-400 text-xs">{fullYearData[hoveredMonth].count} transactions</p>
              </div>
            )}

            {/* Chart Container */}
            <div className="flex items-end justify-between h-48 gap-1 sm:gap-2">
              {fullYearData.map((monthData, index) => {
                const height = maxValue > 0 ? (monthData.total / maxValue) * 100 : 0;
                const isFutureMonth = isCurrentYear && index > currentMonth;
                const isHovered = hoveredMonth === index;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group"
                    onMouseEnter={() => !isFutureMonth && setHoveredMonth(index)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Bar */}
                    <div className="w-full flex justify-center mb-2 h-36 items-end">
                      <div
                        className={`
                          w-full max-w-8 rounded-t-md transition-all duration-200
                          ${isFutureMonth
                            ? 'bg-gray-200 cursor-default'
                            : isHovered
                              ? 'bg-green-500'
                              : 'bg-green-400 hover:bg-green-500 cursor-pointer'
                          }
                        `}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                    {/* Month Label */}
                    <span className={`text-xs ${isFutureMonth ? 'text-gray-400' : 'text-gray-600'}`}>
                      {MONTH_NAMES[index]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-36">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-t border-gray-100 w-full" />
              ))}
            </div>
          </div>

          {/* Monthly Breakdown Legend */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Monthly Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {fullYearData.slice(0, isCurrentYear ? currentMonth + 1 : 12).map((monthData, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="text-gray-600">{MONTH_NAMES[index]}</span>
                  <span className="font-medium text-gray-900">
                    {monthData.total > 0 ? `${(monthData.total / 1000).toFixed(1)}k` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
