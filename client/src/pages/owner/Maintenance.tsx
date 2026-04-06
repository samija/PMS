import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Clock, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { maintenanceAPI } from '../../services/api';

export default function OwnerMaintenance() {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', filters],
    queryFn: () => maintenanceAPI.getAll(filters),
  });

  const { data: statsData } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: () => maintenanceAPI.getStats(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      maintenanceAPI.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] });
      toast.success('Status updated');
      setStatusNote('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, actualCost }: { id: string; actualCost: number }) =>
      maintenanceAPI.complete(id, { actualCost }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] });
      toast.success('Request completed');
      setShowDetailModal(false);
    },
  });

  const requests = data?.data?.data?.requests || [];
  const stats = statsData?.data?.data || {};

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      submitted: 'info',
      acknowledged: 'warning',
      assigned: 'warning',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      low: 'default',
      medium: 'warning',
      high: 'danger',
      emergency: 'danger',
    };
    return variants[priority] || 'default';
  };

  const statusCounts = stats.byStatus?.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <p className="text-gray-600">Manage maintenance requests from tenants</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-700">{statusCounts.submitted || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
        <Card className="bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-700">
                {(statusCounts.acknowledged || 0) + (statusCounts.assigned || 0) + (statusCounts.in_progress || 0)}
              </p>
            </div>
            <Wrench className="h-8 w-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.completed || 0}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        <Card className="bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Emergency</p>
              <p className="text-2xl font-bold text-red-700">
                {stats.byPriority?.find((p: any) => p._id === 'emergency')?.count || 0}
              </p>
            </div>
            <Wrench className="h-8 w-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'acknowledged', label: 'Acknowledged' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Priority' },
              { value: 'emergency', label: 'Emergency' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="w-40"
          />
        </div>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No maintenance requests</h3>
          <p className="mt-2 text-gray-600">All caught up!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request: any) => (
            <Card
              key={request._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex gap-4 min-w-0">
                  <div className={`p-3 rounded-lg flex-shrink-0 ${
                    request.priority === 'emergency' ? 'bg-red-100' :
                    request.priority === 'high' ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <Wrench className={`h-6 w-6 ${
                      request.priority === 'emergency' ? 'text-red-600' :
                      request.priority === 'high' ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{request.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                      <span className="truncate">{request.propertyId?.name} - Unit {request.unitId?.unitNumber}</span>
                      <span className="capitalize">{request.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 pl-14 sm:pl-0">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getPriorityBadge(request.priority)}>{request.priority}</Badge>
                    <Badge variant={getStatusBadge(request.status)}>{request.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        title="Maintenance Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{selectedRequest.title}</h3>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getPriorityBadge(selectedRequest.priority)}>
                  {selectedRequest.priority}
                </Badge>
                <Badge variant={getStatusBadge(selectedRequest.status)}>
                  {selectedRequest.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="flex justify-between sm:block">
                <p className="text-gray-500">Property</p>
                <p className="font-medium">{selectedRequest.propertyId?.name}</p>
              </div>
              <div className="flex justify-between sm:block">
                <p className="text-gray-500">Unit</p>
                <p className="font-medium">{selectedRequest.unitId?.unitNumber}</p>
              </div>
              <div className="flex justify-between sm:block">
                <p className="text-gray-500">Category</p>
                <p className="font-medium capitalize">{selectedRequest.category}</p>
              </div>
              <div className="flex justify-between sm:block">
                <p className="text-gray-500">Submitted</p>
                <p className="font-medium">
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Timeline */}
            {selectedRequest.timeline?.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Timeline</h4>
                <div className="space-y-3">
                  {selectedRequest.timeline.map((entry: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary-500" />
                      <div>
                        <p className="font-medium capitalize">{entry.status.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.status === 'submitted' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({
                        id: selectedRequest._id,
                        status: 'acknowledged',
                      })}
                      loading={updateStatusMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {(selectedRequest.status === 'acknowledged' || selectedRequest.status === 'submitted') && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({
                        id: selectedRequest._id,
                        status: 'in_progress',
                      })}
                      loading={updateStatusMutation.isPending}
                    >
                      Start Work
                    </Button>
                  )}
                  {selectedRequest.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const cost = prompt('Enter actual cost (ETB):');
                        if (cost) {
                          completeMutation.mutate({
                            id: selectedRequest._id,
                            actualCost: Number(cost),
                          });
                        }
                      }}
                      loading={completeMutation.isPending}
                    >
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedRequest._id,
                      status: 'cancelled',
                    })}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
