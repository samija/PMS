import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Users,
  Shield,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePropertyContext } from '../../hooks/usePropertyContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import api from '../../services/api';

interface IncidentData {
  _id: string;
  title: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  reportedBy: { name: string; _id: string } | string;
  location: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  witnesses: string[];
  policeReport: boolean;
  policeReportNumber?: string;
  images: string[];
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: { name: string } | string;
}

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

const SEVERITY_BAND: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const STATUS_FLOW = [
  { value: 'reported', label: 'Reported' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function IncidentDetail() {
  usePropertyContext();
  const { id: propertyId, incidentId } = useParams<{ id: string; incidentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<IncidentData>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['incident', propertyId, incidentId],
    queryFn: () => api.get(`/properties/${propertyId}/incidents/${incidentId}`),
    enabled: !!propertyId && !!incidentId,
  });

  const incident: IncidentData | null = data?.data?.data?.incident || data?.data?.data || null;

  const statusMutation = useMutation({
    mutationFn: (payload: { status: string; resolution?: string }) =>
      api.patch(`/properties/${propertyId}/incidents/${incidentId}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', propertyId, incidentId] });
      queryClient.invalidateQueries({ queryKey: ['incidents', propertyId] });
      toast.success('Status updated successfully');
      setNewStatus('');
      setResolutionText('');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      api.put(`/properties/${propertyId}/incidents/${incidentId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', propertyId, incidentId] });
      toast.success('Incident updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update incident');
    },
  });

  const handleStatusUpdate = () => {
    if (!newStatus) return;
    const payload: { status: string; resolution?: string } = { status: newStatus };
    if (newStatus === 'resolved' && resolutionText) {
      payload.resolution = resolutionText;
    }
    statusMutation.mutate(payload);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editData);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const getName = (field: { name: string } | string | undefined) => {
    if (!field) return 'Unknown';
    if (typeof field === 'object' && field !== null) return field.name;
    return field;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Incident not found</h3>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => navigate(`/owner/properties/${propertyId}/incidents`)}
        >
          Back to Incidents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(`/owner/properties/${propertyId}/incidents`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Incidents
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className={`h-2 ${SEVERITY_BAND[incident.severity] || 'bg-gray-400'}`} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={SEVERITY_BADGE[incident.severity] || 'default'}>
                  {incident.severity.toUpperCase()}
                </Badge>
                <Badge variant={STATUS_BADGE[incident.status] || 'default'}>
                  {incident.status}
                </Badge>
                <Badge variant="info">{formatType(incident.type)}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <Button variant="secondary" size="sm" onClick={() => {
                  setEditData({
                    title: incident.title,
                    description: incident.description,
                    location: incident.location,
                    type: incident.type,
                    severity: incident.severity,
                  });
                  setIsEditing(true);
                }}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit mode */}
      {isEditing && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Incident</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={editData.title || ''}
                onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={editData.location || ''}
                onChange={(e) => setEditData((d) => ({ ...d, location: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              rows={4}
              value={editData.description || ''}
              onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info grid */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{formatType(incident.type)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{incident.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Occurred At</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(incident.occurredAt || incident.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Reported By</p>
                  <p className="font-medium text-gray-900">{getName(incident.reportedBy)}</p>
                </div>
              </div>
              {incident.witnesses && incident.witnesses.length > 0 && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Witnesses</p>
                    <p className="font-medium text-gray-900">{incident.witnesses.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {incident.description}
            </p>
          </div>

          {/* Images */}
          {incident.images && incident.images.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incident.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={img}
                      alt={`Incident image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {incident.resolution && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-3">Resolution</h2>
              <p className="text-green-800 whitespace-pre-wrap">{incident.resolution}</p>
              {incident.resolvedAt && (
                <p className="text-sm text-green-600 mt-3">
                  Resolved on {formatDate(incident.resolvedAt)}
                  {incident.resolvedBy && ` by ${getName(incident.resolvedBy)}`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column - Actions */}
        <div className="space-y-6">
          {/* Police Report */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Police Report</h2>
            </div>
            {incident.policeReport ? (
              <div>
                <Badge variant="info">Report Filed</Badge>
                {incident.policeReportNumber && (
                  <p className="text-sm text-gray-600 mt-2">
                    Report #: {incident.policeReportNumber}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No police report filed</p>
            )}
          </div>

          {/* Status Update */}
          {incident.status !== 'closed' && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
              <div className="space-y-3">
                <Select
                  label="New Status"
                  options={[
                    { value: '', label: 'Select status...' },
                    ...STATUS_FLOW.filter((s) => s.value !== incident.status),
                  ]}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                />

                {newStatus === 'resolved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resolution Details
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      rows={4}
                      placeholder="Describe how the incident was resolved..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={!newStatus || statusMutation.isPending}
                  onClick={handleStatusUpdate}
                >
                  {statusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reported</p>
                  <p className="text-xs text-gray-500">{formatDate(incident.createdAt)}</p>
                </div>
              </div>
              {incident.status !== 'reported' && (
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Investigating</p>
                  </div>
                </div>
              )}
              {(incident.status === 'resolved' || incident.status === 'closed') && (
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Resolved</p>
                    {incident.resolvedAt && (
                      <p className="text-xs text-gray-500">{formatDate(incident.resolvedAt)}</p>
                    )}
                  </div>
                </div>
              )}
              {incident.status === 'closed' && (
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Closed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
