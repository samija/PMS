import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Wrench, CreditCard, Clock } from 'lucide-react';
import { maintenanceAPI, paymentAPI } from '../../services/api';

interface FeedItem {
  id: string;
  type: 'incident' | 'maintenance' | 'payment';
  description: string;
  timestamp: string;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const typeConfig = {
  incident: {
    icon: AlertTriangle,
    dotColor: 'bg-red-500',
    borderColor: 'border-l-red-400',
    iconColor: 'text-red-500',
  },
  maintenance: {
    icon: Wrench,
    dotColor: 'bg-orange-500',
    borderColor: 'border-l-orange-400',
    iconColor: 'text-orange-500',
  },
  payment: {
    icon: CreditCard,
    dotColor: 'bg-green-500',
    borderColor: 'border-l-green-400',
    iconColor: 'text-green-500',
  },
};

export default function ActivityFeed() {
  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance-feed'],
    queryFn: () => maintenanceAPI.getAll({ limit: 10 }),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['payments-feed'],
    queryFn: () => paymentAPI.getAll({ limit: 10 }),
  });

  const maintenanceRequests = maintenanceData?.data?.data?.requests || [];
  const payments = paymentsData?.data?.data?.payments || [];

  const feedItems: FeedItem[] = [
    ...maintenanceRequests.map((r: any) => ({
      id: `m-${r._id}`,
      type: 'maintenance' as const,
      description: `${r.title} - ${r.status?.replace('_', ' ')}`,
      timestamp: r.updatedAt || r.createdAt,
    })),
    ...payments.map((p: any) => ({
      id: `p-${p._id}`,
      type: 'payment' as const,
      description: `${p.amount?.toLocaleString()} ETB ${p.type} payment - ${p.status}`,
      timestamp: p.updatedAt || p.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
        <Clock className="h-4 w-4 text-gray-400" />
      </div>

      {feedItems.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">No recent activity</p>
      ) : (
        <div className="space-y-1">
          {feedItems.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${config.borderColor} bg-gray-50/50 hover:bg-gray-50 transition-colors`}
              >
                <div className={`mt-0.5 ${config.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(item.timestamp)}</p>
                </div>
                <div className={`h-2 w-2 rounded-full ${config.dotColor} mt-1.5 flex-shrink-0`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
