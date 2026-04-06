import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, MapPin, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import api from '../../services/api';
import { usePropertyContext } from '../../hooks/usePropertyContext';

interface Incident {
  _id: string;
  title: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  reportedBy: { name: string } | string;
  location: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  witnesses: string[];
  policeReport: boolean;
  images: string[];
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const SEVERITY_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  reported: 'info',
  investigating: 'warning',
  resolved: 'success',
  closed: 'default',
};

const INCIDENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'theft', label: 'Theft' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'noise_complaint', label: 'Noise Complaint' },
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood' },
  { value: 'assault', label: 'Assault' },
  { value: 'trespassing', label: 'Trespassing' },
  { value: 'property_damage', label: 'Property Damage' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function Incidents() {
  usePropertyContext();
  const { id: propertyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ severity: '', status: '', type: '' });
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'other',
    severity: 'low',
    title: '',
    description: '',
    location: '',
    occurredAt: '',
    witnesses: '',
    policeReport: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', propertyId, filters, page],
    queryFn: () =>
      api.get(`/properties/${propertyId}/incidents`, {
        params: { ...filters, page, limit: 12 },
      }),
    enabled: !!propertyId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post(`/properties/${propertyId}/incidents`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', propertyId] });
      toast.success('Incident reported successfully');
      setShowCreateModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to report incident');
    },
  });

  const incidents: Incident[] = data?.data?.data?.data || data?.data?.data || [];
  const pagination = data?.data?.data?.pagination || { total: 0, pages: 1 };

  const resetForm = () => {
    setFormData({
      type: 'other',
      severity: 'low',
      title: '',
      description: '',
      location: '',
      occurredAt: '',
      witnesses: '',
      policeReport: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    const payload = {
      ...formData,
      witnesses: formData.witnesses
        ? formData.witnesses.split(',').map((w) => w.trim()).filter(Boolean)
        : [],
    };
    createMutation.mutate(payload);
  };

  const getReporterName = (reportedBy: Incident['reportedBy']) => {
    if (typeof reportedBy === 'object' && reportedBy !== null) return reportedBy.name;
    return reportedBy || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Log</h1>
          <p className="text-gray-500 mt-1">Track and manage property incidents</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={filters.severity}
            onChange={(e) => {
              setFilters((f) => ({ ...f, severity: e.target.value }));
              setPage(1);
            }}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
          />
          <Select
            label="Type"
            options={INCIDENT_TYPES}
            value={filters.type}
            onChange={(e) => {
              setFilters((f) => ({ ...f, type: e.target.value }));
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Incident Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No incidents found</h3>
          <p className="text-gray-500">No incidents match the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.map((incident) => (
            <div
              key={incident._id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                navigate(`/owner/properties/${propertyId}/incidents/${incident._id}`)
              }
            >
              {/* Severity color band */}
              <div className={`h-1.5 ${SEVERITY_COLORS[incident.severity] || 'bg-gray-400'}`} />

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{incident.title}</h3>
                  <Badge variant={STATUS_BADGE[incident.status] || 'default'}>
                    {incident.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={SEVERITY_BADGE[incident.severity] || 'default'}>
                    {incident.severity}
                  </Badge>
                  <Badge variant="info">{formatType(incident.type)}</Badge>
                </div>

                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{getReporterName(incident.reportedBy)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(incident.occurredAt || incident.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{incident.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Report Incident Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Report Incident"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Incident Type"
              options={INCIDENT_TYPES.filter((t) => t.value !== '')}
              value={formData.type}
              onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
            />
            <Select
              label="Severity"
              options={SEVERITY_OPTIONS.filter((s) => s.value !== '')}
              value={formData.severity}
              onChange={(e) => setFormData((f) => ({ ...f, severity: e.target.value }))}
            />
          </div>

          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
            placeholder="Brief description of the incident"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Detailed account of the incident..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Location *"
              value={formData.location}
              onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g., Building A, Floor 2"
            />
            <Input
              label="Occurred At"
              type="datetime-local"
              value={formData.occurredAt}
              onChange={(e) => setFormData((f) => ({ ...f, occurredAt: e.target.value }))}
            />
          </div>

          <Input
            label="Witnesses (comma separated)"
            value={formData.witnesses}
            onChange={(e) => setFormData((f) => ({ ...f, witnesses: e.target.value }))}
            placeholder="John Doe, Jane Smith"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="policeReport"
              checked={formData.policeReport}
              onChange={(e) => setFormData((f) => ({ ...f, policeReport: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="policeReport" className="text-sm text-gray-700">
              Police report filed
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Report Incident'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
