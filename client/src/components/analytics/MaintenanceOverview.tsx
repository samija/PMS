import { useQuery } from '@tanstack/react-query';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { maintenanceAPI } from '../../services/api';

interface MaintenanceRequest {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  unitId?: {
    unitNumber: string;
  };
  propertyId?: {
    name: string;
  };
}

interface MaintenanceStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  averageResolutionTime?: number;
}

interface MaintenanceOverviewProps {
  className?: string;
}

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badgeVariant: 'info' as const
  },
  acknowledged: {
    label: 'Acknowledged',
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    badgeVariant: 'warning' as const
  },
  assigned: {
    label: 'Assigned',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    badgeVariant: 'warning' as const
  },
  in_progress: {
    label: 'In Progress',
    icon: Wrench,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    badgeVariant: 'warning' as const
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    badgeVariant: 'success' as const
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    badgeVariant: 'default' as const
  },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  emergency: { label: 'Emergency', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function MaintenanceOverview({ className = '' }: MaintenanceOverviewProps) {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: () => maintenanceAPI.getStats(),
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['maintenance', 'recent'],
    queryFn: () => maintenanceAPI.getAll({ limit: 5, sort: '-createdAt' }),
  });

  const stats: MaintenanceStats = statsData?.data?.data || {
    total: 0,
    byStatus: {},
    byPriority: {},
  };

  const recentRequests: MaintenanceRequest[] = recentData?.data?.data?.requests || [];

  const isLoading = statsLoading || recentLoading;

  // Calculate active requests (not completed or cancelled)
  const activeCount = (stats.byStatus?.submitted || 0) +
                     (stats.byStatus?.acknowledged || 0) +
                     (stats.byStatus?.assigned || 0) +
                     (stats.byStatus?.in_progress || 0);

  const urgentCount = (stats.byPriority?.high || 0) + (stats.byPriority?.emergency || 0);

  // Status flow for visualization
  const statusFlow = ['submitted', 'acknowledged', 'assigned', 'in_progress', 'completed'];

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wrench className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Maintenance Overview</h3>
            <p className="text-sm text-gray-500">Request status and trends</p>
          </div>
        </div>
        <Link
          to="/owner/maintenance"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              <p className="text-xs text-gray-500">Total Requests</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <p className="text-xs text-gray-500">Urgent</p>
            </div>
          </div>

          {/* Status Flow Visualization */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Request Pipeline</p>
            <div className="flex items-center justify-between">
              {statusFlow.map((status, index) => {
                const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                const count = stats.byStatus?.[status] || 0;
                const Icon = config.icon;
                const isLast = index === statusFlow.length - 1;

                return (
                  <div key={status} className="flex items-center flex-1">
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`p-2 rounded-full ${config.bgColor} mb-2`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500 text-center">{config.label}</p>
                    </div>
                    {!isLast && (
                      <div className="h-px w-4 bg-gray-300 mb-8" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">By Priority</p>
            <div className="space-y-2">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => {
                const count = stats.byPriority?.[key] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`text-xs font-medium min-w-[70px] ${config.color}`}>
                      {config.label}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${config.bgColor} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 min-w-[30px] text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Requests */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Recent Requests</p>
            {recentRequests.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No maintenance requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.submitted;
                  const priorityConfig = PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

                  return (
                    <Link
                      key={request._id}
                      to="/owner/maintenance"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-full ${priorityConfig.bgColor}`}>
                          <Wrench className={`h-3 w-3 ${priorityConfig.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {request.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.unitId?.unitNumber
                              ? `Unit ${request.unitId.unitNumber}`
                              : request.propertyId?.name || 'Unknown'
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusConfig.badgeVariant} className="ml-2">
                        {statusConfig.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
