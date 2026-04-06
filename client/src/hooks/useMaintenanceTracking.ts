import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceAPI } from '../services/api';
import type { MaintenanceRequest } from '../types';

type MaintenanceStatus = MaintenanceRequest['status'];

const STATUS_COLUMNS: MaintenanceStatus[] = [
  'submitted',
  'acknowledged',
  'assigned',
  'in_progress',
  'completed',
];

export function useMaintenanceTracking(propertyId?: string) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['maintenance', propertyId, statusFilter, priorityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (propertyId) params.propertyId = propertyId;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;

      const response = await maintenanceAPI.getAll(params);
      return response.data?.data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      return maintenanceAPI.updateStatus(id, status, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const groupedByStatus = STATUS_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = requests.filter((r: MaintenanceRequest) => r.status === status);
      return acc;
    },
    {} as Record<MaintenanceStatus, MaintenanceRequest[]>
  );

  const stats = {
    total: requests.length,
    open: requests.filter((r: MaintenanceRequest) => !['completed', 'cancelled'].includes(r.status)).length,
    completed: requests.filter((r: MaintenanceRequest) => r.status === 'completed').length,
    emergency: requests.filter((r: MaintenanceRequest) => r.priority === 'emergency').length,
  };

  return {
    requests,
    isLoading,
    groupedByStatus,
    stats,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    STATUS_COLUMNS,
  };
}

export default useMaintenanceTracking;
