import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { maintenanceAPI } from '../../services/api';

export default function TenantMaintenance() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
  });

  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    feedback: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-maintenance'],
    queryFn: () => maintenanceAPI.getAll({}),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => maintenanceAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-maintenance'] });
      toast.success('Maintenance request submitted');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, rating, feedback }: { id: string; rating: number; feedback: string }) =>
      maintenanceAPI.submitFeedback(id, rating, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-maintenance'] });
      toast.success('Feedback submitted');
      setShowFeedbackModal(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    },
  });

  const requests = data?.data?.data?.requests || [];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleFeedback = () => {
    if (!selectedRequest) return;
    feedbackMutation.mutate({
      id: selectedRequest._id,
      rating: feedbackData.rating,
      feedback: feedbackData.feedback,
    });
  };

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

  const categories = [
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'appliance', label: 'Appliance' },
    { value: 'structural', label: 'Structural' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'emergency', label: 'Emergency' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm sm:text-base text-gray-600">Submit and track maintenance requests</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

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
          <p className="mt-2 text-gray-600">Need something fixed? Submit a maintenance request.</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
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
                  <div
                    className={`p-3 rounded-lg flex-shrink-0 ${
                      request.priority === 'emergency'
                        ? 'bg-red-100'
                        : request.priority === 'high'
                          ? 'bg-orange-100'
                          : 'bg-gray-100'
                    }`}
                  >
                    <Wrench
                      className={`h-6 w-6 ${
                        request.priority === 'emergency'
                          ? 'text-red-600'
                          : request.priority === 'high'
                            ? 'text-orange-600'
                            : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{request.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
                    <p className="text-sm text-gray-500 mt-2 capitalize">
                      {request.category} | Submitted {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 pl-14 sm:pl-0">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getPriorityBadge(request.priority)}>{request.priority}</Badge>
                    <Badge variant={getStatusBadge(request.status)}>{request.status.replace('_', ' ')}</Badge>
                  </div>
                  {request.status === 'completed' && !request.tenantRating && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
                        setShowFeedbackModal(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Rate
                    </Button>
                  )}
                  {request.tenantRating && (
                    <div className="flex items-center text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < request.tenantRating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Submit Maintenance Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            placeholder="Brief description of the issue"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categories}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <Select
              label="Priority"
              options={priorities}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="input min-h-[120px]"
              placeholder="Provide detailed description of the issue..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending} className="w-full sm:w-auto">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRequest(null);
        }}
        title="Request Details"
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
                <Badge variant={getPriorityBadge(selectedRequest.priority)}>{selectedRequest.priority}</Badge>
                <Badge variant={getStatusBadge(selectedRequest.status)}>
                  {selectedRequest.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="flex justify-between sm:block">
                <p className="text-gray-500">Category</p>
                <p className="font-medium capitalize">{selectedRequest.category}</p>
              </div>
              <div className="flex justify-between sm:block">
                <p className="text-gray-500">Submitted</p>
                <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
              {selectedRequest.scheduledDate && (
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Scheduled</p>
                  <p className="font-medium">{new Date(selectedRequest.scheduledDate).toLocaleString()}</p>
                </div>
              )}
              {selectedRequest.completedAt && (
                <div className="flex justify-between sm:block">
                  <p className="text-gray-500">Completed</p>
                  <p className="font-medium">{new Date(selectedRequest.completedAt).toLocaleString()}</p>
                </div>
              )}
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
                        <p className="text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                        {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRequest.status === 'completed' && !selectedRequest.tenantRating && (
              <div className="border-t pt-4">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowFeedbackModal(true);
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Leave Feedback
                </Button>
              </div>
            )}

            {selectedRequest.tenantRating && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Your Feedback</h4>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < selectedRequest.tenantRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {selectedRequest.tenantFeedback && <p className="text-gray-600">{selectedRequest.tenantFeedback}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedRequest(null);
        }}
        title="Rate Maintenance Service"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= feedbackData.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback (optional)</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Share your experience..."
              value={feedbackData.feedback}
              onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFeedbackModal(false);
                setSelectedRequest(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleFeedback} loading={feedbackMutation.isPending} className="w-full sm:w-auto">
              Submit Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
