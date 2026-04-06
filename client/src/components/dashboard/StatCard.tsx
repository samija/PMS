import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  link?: string;
  trend?: { value: number; label: string };
  progress?: { current: number; max: number };
}

export default function StatCard({ title, value, icon: Icon, color, bgColor, link, trend, progress }: StatCardProps) {
  const content = (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend.value >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}

      {progress && progress.max > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                (progress.current / progress.max) >= 0.9 ? 'bg-green-500' :
                (progress.current / progress.max) >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min((progress.current / progress.max) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}
