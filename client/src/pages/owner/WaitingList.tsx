import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Check, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { waitingListAPI, propertyAPI } from '../../services/api';

export default function WaitingList() {
  const [filters, setFilters] = useState({
    propertyId: '',
    status: '',
  });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['waiting-list', filters],
    queryFn: () => waitingListAPI.getAll(filters),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => propertyAPI.getAll({ limit: 100 }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['vacant-units', selectedEntry?.propertyId?._id],
    queryFn: () => propertyAPI.getUnits(selectedEntry?.propertyId?._id, { status: 'vacant' }),
    enabled: !!selectedEntry?.propertyId?._id,
  });

  const offerMutation = useMutation({
    mutationFn: ({ id, unitId }: { id: string; unitId: string }) =>
      waitingListAPI.offerUnit(id, { unitId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
      toast.success('Offer sent successfully');
      setShowOfferModal(false);
      setSelectedEntry(null);
      setSelectedUnitId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send offer');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      waitingListAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiting-list'] });
      toast.success('Status updated');
    },
  });

  const entries = data?.data?.data?.entries || [];
  const properties = propertiesData?.data?.data?.properties || [];
  const units = unitsData?.data?.data || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      waiting: 'info',
      offered: 'warning',
      accepted: 'success',
      rejected: 'danger',
      expired: 'default',
    };
    return variants[status] || 'default';
  };

  const handleOffer = () => {
    if (!selectedEntry || !selectedUnitId) return;
    offerMutation.mutate({ id: selectedEntry._id, unitId: selectedUnitId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Waiting List</h1>
        <p className="text-gray-600">Manage applicants and waiting list</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <Select
            options={[
              { value: '', label: 'All Properties' },
              ...properties.map((p: any) => ({ value: p._id, label: p.name })),
            ]}
            value={filters.propertyId}
            onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
            className="w-48"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'waiting', label: 'Waiting' },
              { value: 'offered', label: 'Offered' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'expired', label: 'Expired' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-40"
          />
        </div>
      </Card>

      {/* Waiting List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No entries found</h3>
          <p className="mt-2 text-gray-600">
            There are no applications or waiting list entries yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry: any) => (
            <Card key={entry._id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {entry.position || entry.applicantId?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {entry.applicantId?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-500">{entry.applicantId?.email}</p>
                    <p className="text-sm text-gray-500">
                      {entry.propertyId?.name}
                      {entry.unitId && ` - Unit ${entry.unitId.unitNumber}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant={getStatusBadge(entry.status)}>{entry.status}</Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      Applied: {new Date(entry.appliedAt).toLocaleDateString()}
                    </p>
                    {entry.type === 'queue' && entry.position && (
                      <p className="text-xs text-gray-500">Position: #{entry.position}</p>
                    )}
                  </div>

                  {entry.status === 'waiting' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowOfferModal(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Offer
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => updateStatusMutation.mutate({ id: entry._id, status: 'rejected' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {entry.status === 'offered' && (
                    <div className="text-sm text-gray-500">
                      Expires: {new Date(entry.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {entry.application && (
                <div className="mt-4 pt-4 border-t grid sm:grid-cols-3 gap-4 text-sm">
                  {entry.application.employmentInfo && (
                    <div>
                      <p className="text-gray-500">Employment</p>
                      <p className="font-medium">{entry.application.employmentInfo}</p>
                    </div>
                  )}
                  {entry.application.income && (
                    <div>
                      <p className="text-gray-500">Monthly Income</p>
                      <p className="font-medium">{entry.application.income.toLocaleString()} ETB</p>
                    </div>
                  )}
                  {entry.application.references?.length > 0 && (
                    <div>
                      <p className="text-gray-500">References</p>
                      <p className="font-medium">{entry.application.references.length} provided</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={() => {
          setShowOfferModal(false);
          setSelectedEntry(null);
          setSelectedUnitId('');
        }}
        title="Send Unit Offer"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">{selectedEntry?.applicantId?.name}</p>
            <p className="text-sm text-gray-500">{selectedEntry?.propertyId?.name}</p>
          </div>

          <Select
            label="Select Unit to Offer"
            options={[
              { value: '', label: 'Select a vacant unit' },
              ...units.map((u: any) => ({
                value: u._id,
                label: `Unit ${u.unitNumber} - Floor ${u.floor} (${u.pricing.totalPrice.toLocaleString()} ETB/month)`,
              })),
            ]}
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
          />

          {selectedUnitId && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              The applicant will have 3 days to accept or decline this offer.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowOfferModal(false);
                setSelectedEntry(null);
                setSelectedUnitId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOffer}
              disabled={!selectedUnitId}
              loading={offerMutation.isPending}
            >
              Send Offer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
