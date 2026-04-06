import React, { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { MaintenanceCard } from './MaintenanceCard';
import { MaintenanceTimeline } from './MaintenanceTimeline';
import Modal from '../ui/Modal';
import { useMaintenanceTracking } from '../../hooks/useMaintenanceTracking';
import type { MaintenanceRequest } from '../../types';

interface MaintenanceTrackerProps {
  propertyId?: string;
}

const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const statusHeaderColors: Record<string, string> = {
  submitted: 'border-gray-300',
  acknowledged: 'border-blue-300',
  assigned: 'border-purple-300',
  in_progress: 'border-yellow-300',
  completed: 'border-green-300',
};

export const MaintenanceTracker: React.FC<MaintenanceTrackerProps> = ({ propertyId }) => {
  const {
    isLoading,
    groupedByStatus,
    stats,
    priorityFilter,
    setPriorityFilter,
    STATUS_COLUMNS,
  } = useMaintenanceTracking(propertyId);

  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.emergency}</p>
              <p className="text-xs text-gray-500">Emergency</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
        >
          <option value="all">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((status) => (
          <div key={status} className="flex-shrink-0 w-72">
            <div className={`border-t-4 ${statusHeaderColors[status]} rounded-t-lg`}>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg">
                <h3 className="text-sm font-semibold text-gray-700">
                  {statusLabels[status]}
                </h3>
                <Badge variant="default">
                  {groupedByStatus[status]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2 p-2 min-h-[200px] bg-gray-50/50 rounded-b-lg">
                {groupedByStatus[status]?.map((request: MaintenanceRequest) => (
                  <MaintenanceCard
                    key={request._id}
                    request={request}
                    onClick={setSelectedRequest}
                  />
                ))}
                {(!groupedByStatus[status] || groupedByStatus[status].length === 0) && (
                  <p className="text-xs text-gray-400 text-center py-8">No requests</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={selectedRequest.title}
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant={selectedRequest.priority === 'emergency' ? 'danger' : 'default'}>
                {selectedRequest.priority}
              </Badge>
              <Badge>{selectedRequest.category}</Badge>
              <Badge>{selectedRequest.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-gray-600">{selectedRequest.description}</p>

            {selectedRequest.estimatedCost && (
              <p className="text-sm">
                <span className="font-medium">Estimated Cost:</span>{' '}
                {selectedRequest.estimatedCost.toLocaleString()} ETB
              </p>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-3">Timeline</h4>
              <MaintenanceTimeline timeline={selectedRequest.timeline} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceTracker;
