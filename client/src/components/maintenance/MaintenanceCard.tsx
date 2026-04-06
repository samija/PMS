import React from 'react';
import { Clock, AlertTriangle, User, Wrench } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { MaintenanceRequest } from '../../types';

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  onClick?: (request: MaintenanceRequest) => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
};

const categoryIcons: Record<string, string> = {
  plumbing: '🔧',
  electrical: '⚡',
  appliance: '🏠',
  structural: '🏗️',
  hvac: '❄️',
  other: '📋',
};

export const MaintenanceCard: React.FC<MaintenanceCardProps> = ({ request, onClick }) => {
  const daysOpen = Math.floor(
    (Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(request)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 line-clamp-2">
          {request.title}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${priorityColors[request.priority]}`}>
          {request.priority}
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <span>{categoryIcons[request.category] || '📋'}</span>
        <span className="capitalize">{request.category}</span>
      </div>

      {request.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{request.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{daysOpen}d ago</span>
        </div>
        {request.assignedTo && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{typeof request.assignedTo === 'object' ? request.assignedTo.name : 'Assigned'}</span>
          </div>
        )}
      </div>

      {request.unitId && (
        <div className="mt-2 text-xs text-gray-400">
          Unit {typeof request.unitId === 'object' ? request.unitId.unitNumber : request.unitId}
        </div>
      )}
    </Card>
  );
};

export default MaintenanceCard;
