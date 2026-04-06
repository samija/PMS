import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit2,
  Send,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import api from '../../services/api';
import { usePropertyContext } from '../../hooks/usePropertyContext';

const RATING_CATEGORIES = [
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'workQuality', label: 'Work Quality' },
  { key: 'teamwork', label: 'Teamwork' },
  { key: 'communication', label: 'Communication' },
  { key: 'reliability', label: 'Reliability' },
] as const;

type RatingKey = (typeof RATING_CATEGORIES)[number]['key'];

interface ReviewForm {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  ratings: Record<RatingKey, number>;
  strengths: string;
  improvements: string;
  comments: string;
}

const defaultFormState: ReviewForm = {
  employeeId: '',
  periodStart: '',
  periodEnd: '',
  ratings: {
    punctuality: 3,
    workQuality: 3,
    teamwork: 3,
    communication: 3,
    reliability: 3,
  },
  strengths: '',
  improvements: '',
  comments: '',
};

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'bg-green-500';
  if (rating >= 3.5) return 'bg-blue-500';
  if (rating >= 2.5) return 'bg-yellow-500';
  if (rating >= 1.5) return 'bg-orange-500';
  return 'bg-red-500';
}

function getRatingTextColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 3.5) return 'text-blue-600';
  if (rating >= 2.5) return 'text-yellow-600';
  if (rating >= 1.5) return 'text-orange-600';
  return 'text-red-600';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className={`ml-1.5 text-sm font-medium ${getRatingTextColor(rating)}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 5) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${getRatingColor(value)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-8 text-right">{value}/5</span>
    </div>
  );
}

export default function PerformanceReviews() {
  usePropertyContext();
  const { id: propertyId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<ReviewForm>(defaultFormState);

  const limit = 10;

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['reviews', propertyId, page],
    queryFn: () =>
      api.get(`/properties/${propertyId}/reviews`, {
        params: { page, limit },
      }),
    enabled: !!propertyId,
  });

  const reviews = reviewsData?.data?.data?.reviews || reviewsData?.data?.data || [];
  const pagination = reviewsData?.data?.data?.pagination || {};
  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / limit) || 1;

  // Fetch employees for the dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-reviews', propertyId],
    queryFn: () =>
      api.get('/employees', {
        params: { propertyId, status: 'active', limit: 100 },
      }),
    enabled: !!propertyId,
  });

  const employees = employeesData?.data?.data?.employees || employeesData?.data?.data || [];
  const employeeOptions = [
    { value: '', label: 'Select Employee' },
    ...employees.map((emp: any) => ({
      value: emp._id,
      label: emp.userId?.name || emp.name || emp.employeeId || 'Unknown',
    })),
  ];

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/properties/${propertyId}/reviews`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] });
      toast.success('Review created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create review');
    },
  });

  // Update review mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/properties/${propertyId}/reviews/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] });
      toast.success('Review updated successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update review');
    },
  });

  // Submit review mutation
  const submitMutation = useMutation({
    mutationFn: (reviewId: string) =>
      api.patch(`/properties/${propertyId}/reviews/${reviewId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] });
      toast.success('Review submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });

  // Acknowledge review mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (reviewId: string) =>
      api.patch(`/properties/${propertyId}/reviews/${reviewId}/acknowledge`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', propertyId] });
      toast.success('Review acknowledged');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge review');
    },
  });

  const closeModal = () => {
    setShowFormModal(false);
    setEditingReviewId(null);
    setFormData(defaultFormState);
  };

  const openCreateModal = () => {
    setFormData(defaultFormState);
    setEditingReviewId(null);
    setShowFormModal(true);
  };

  const openEditModal = (review: any) => {
    setFormData({
      employeeId: review.employeeId?._id || review.employeeId || '',
      periodStart: review.periodStart?.slice(0, 10) || '',
      periodEnd: review.periodEnd?.slice(0, 10) || '',
      ratings: {
        punctuality: review.ratings?.punctuality || 3,
        workQuality: review.ratings?.workQuality || 3,
        teamwork: review.ratings?.teamwork || 3,
        communication: review.ratings?.communication || 3,
        reliability: review.ratings?.reliability || 3,
      },
      strengths: review.strengths || '',
      improvements: review.improvements || '',
      comments: review.comments || '',
    });
    setEditingReviewId(review._id);
    setShowFormModal(true);
  };

  const handleSubmitForm = () => {
    const payload = {
      employeeId: formData.employeeId,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      ratings: formData.ratings,
      strengths: formData.strengths,
      improvements: formData.improvements,
      comments: formData.comments,
    };

    if (editingReviewId) {
      updateMutation.mutate({ id: editingReviewId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleRatingChange = (key: RatingKey, value: number) => {
    const clamped = Math.min(5, Math.max(1, value));
    setFormData({
      ...formData,
      ratings: { ...formData.ratings, [key]: clamped },
    });
  };

  const getOverallRating = (ratings: Record<string, number>): number => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'submitted':
        return <Badge variant="info">Submitted</Badge>;
      case 'acknowledged':
        return <Badge variant="success">Acknowledged</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const toggleExpand = (reviewId: string) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          <p className="text-gray-500 mt-1">Evaluate and track employee performance</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Create Review
        </Button>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No performance reviews found</p>
            <p className="text-sm text-gray-400 mt-1">Create a review to get started</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const overall = getOverallRating(review.ratings || {});
            const isExpanded = expandedReview === review._id;

            return (
              <Card key={review._id}>
                <div className="p-4 sm:p-5">
                  {/* Review Header */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpand(review._id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {review.employeeId?.userId?.name ||
                            review.employeeName ||
                            'Unknown Employee'}
                        </h3>
                        {getStatusBadge(review.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        Review Period:{' '}
                        {review.periodStart
                          ? new Date(review.periodStart).toLocaleDateString()
                          : 'N/A'}{' '}
                        &mdash;{' '}
                        {review.periodEnd
                          ? new Date(review.periodEnd).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      <div className="mt-2">
                        <StarRating rating={overall} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Rating Bars */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Ratings</h4>
                        {RATING_CATEGORIES.map(({ key, label }) => (
                          <RatingBar
                            key={key}
                            label={label}
                            value={review.ratings?.[key] || 0}
                          />
                        ))}
                      </div>

                      {/* Comments Sections */}
                      {review.strengths && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Strengths</h4>
                          <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">
                            {review.strengths}
                          </p>
                        </div>
                      )}
                      {review.improvements && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Areas for Improvement
                          </h4>
                          <p className="text-sm text-gray-600 bg-yellow-50 rounded-lg p-3">
                            {review.improvements}
                          </p>
                        </div>
                      )}
                      {review.comments && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                            Additional Comments
                          </h4>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                            {review.comments}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {review.status === 'draft' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                openEditModal(review);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                submitMutation.mutate(review._id);
                              }}
                              disabled={submitMutation.isPending}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              Submit
                            </Button>
                          </>
                        )}
                        {review.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              acknowledgeMutation.mutate(review._id);
                            }}
                            disabled={acknowledgeMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-md border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Review Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={closeModal}
        title={editingReviewId ? 'Edit Review' : 'Create Review'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Employee Selection */}
          <Select
            label="Employee"
            options={employeeOptions}
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          />

          {/* Review Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Period Start"
              type="date"
              value={formData.periodStart}
              onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
            />
            <Input
              label="Period End"
              type="date"
              value={formData.periodEnd}
              onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
            />
          </div>

          {/* Ratings */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ratings (1-5)</h4>
            <div className="space-y-3">
              {RATING_CATEGORIES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 w-32 shrink-0">{label}</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={formData.ratings[key]}
                    onChange={(e) => handleRatingChange(key, Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex items-center gap-1 w-16 justify-end">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.ratings[key]}
                      onChange={(e) => handleRatingChange(key, Number(e.target.value))}
                      className="w-12 text-center text-sm border rounded-md px-1 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Overall:</span>
              <StarRating rating={getOverallRating(formData.ratings)} />
            </div>
          </div>

          {/* Text Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
            <textarea
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              rows={3}
              placeholder="What does this employee do well?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Areas for Improvement
            </label>
            <textarea
              value={formData.improvements}
              onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
              rows={3}
              placeholder="What areas can this employee improve in?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
              placeholder="Any other comments or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForm} disabled={isSaving || !formData.employeeId}>
              {isSaving
                ? 'Saving...'
                : editingReviewId
                  ? 'Update Review'
                  : 'Create Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
