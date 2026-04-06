import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put('/auth/profile', data),
};

// Properties
export const propertyAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/properties', { params }),
  getOne: (id: string) => api.get(`/properties/${id}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  toggleListing: (id: string) => api.patch(`/properties/${id}/listing`),
  // Units
  addUnit: (propertyId: string, data: any) =>
    api.post(`/properties/${propertyId}/units`, data),
  getUnits: (propertyId: string, params?: any) =>
    api.get(`/properties/${propertyId}/units`, { params }),
  updateUnit: (propertyId: string, unitId: string, data: any) =>
    api.put(`/properties/${propertyId}/units/${unitId}`, data),
  deleteUnit: (propertyId: string, unitId: string) =>
    api.delete(`/properties/${propertyId}/units/${unitId}`),
  // Property Images
  uploadImages: (propertyId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post(`/properties/${propertyId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (propertyId: string, imageUrl: string) =>
    api.delete(`/properties/${propertyId}/images`, { data: { imageUrl } }),
  setPrimaryImage: (propertyId: string, imageUrl: string) =>
    api.patch(`/properties/${propertyId}/images/primary`, { imageUrl }),
  // Unit Images
  uploadUnitImages: (propertyId: string, unitId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post(`/properties/${propertyId}/units/${unitId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteUnitImage: (propertyId: string, unitId: string, imageUrl: string) =>
    api.delete(`/properties/${propertyId}/units/${unitId}/images`, { data: { imageUrl } }),
  setUnitPrimaryImage: (propertyId: string, unitId: string, imageUrl: string) =>
    api.patch(`/properties/${propertyId}/units/${unitId}/images/primary`, { imageUrl }),
};

// Tenants
export const tenantAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string; propertyId?: string }) =>
    api.get('/tenants', { params }),
  getOne: (id: string) => api.get(`/tenants/${id}`),
  create: (data: any) => api.post('/tenants', data),
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  terminate: (id: string) => api.post(`/tenants/${id}/terminate`),
  getMyTenancy: () => api.get('/tenants/my/tenancy'),
  // Documents
  uploadDocument: (tenantId: string, file: File, type: string, name: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    formData.append('name', name);
    return api.post(`/tenants/${tenantId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDocuments: (tenantId: string) => api.get(`/tenants/${tenantId}/documents`),
  deleteDocument: (tenantId: string, documentId: string) =>
    api.delete(`/tenants/${tenantId}/documents/${documentId}`),
};

// Payments
export const paymentAPI = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  initialize: (data: any) => api.post('/payments/initialize', data),
  verify: (txRef: string) => api.get(`/payments/verify/${txRef}`),
  createManual: (data: any) => api.post('/payments/manual', data),
  getStats: (year?: number) => api.get('/payments/stats/summary', { params: { year } }),
  // Bank transfer
  submitBankTransfer: (data: any, receiptFile: File) => {
    const formData = new FormData();
    formData.append('tenantId', data.tenantId);
    formData.append('amount', data.amount.toString());
    formData.append('type', data.type);
    formData.append('month', data.month.toString());
    formData.append('year', data.year.toString());
    if (data.dueDate) formData.append('dueDate', data.dueDate);
    formData.append('receipt', receiptFile);
    return api.post('/payments/bank-transfer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPendingApproval: (params?: any) => api.get('/payments/pending-approval', { params }),
  approvePayment: (id: string, notes?: string) => api.patch(`/payments/${id}/approve`, { notes }),
  rejectPayment: (id: string, notes?: string) => api.patch(`/payments/${id}/reject`, { notes }),
};

// Waiting List
export const waitingListAPI = {
  getAll: (params?: any) => api.get('/waitlist', { params }),
  apply: (data: any) => api.post('/waitlist/apply', data),
  offerUnit: (id: string, data: { unitId: string; expiresInDays?: number }) =>
    api.post(`/waitlist/${id}/offer`, data),
  respond: (id: string, accept: boolean) =>
    api.post(`/waitlist/${id}/respond`, { accept }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/waitlist/${id}/status`, { status }),
  getMyApplications: () => api.get('/waitlist/my-applications'),
};

// Maintenance
export const maintenanceAPI = {
  getAll: (params?: any) => api.get('/maintenance', { params }),
  getOne: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: any) => api.post('/maintenance', data),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/maintenance/${id}/status`, { status, note }),
  assign: (id: string, data: any) => api.post(`/maintenance/${id}/assign`, data),
  complete: (id: string, data: any) => api.post(`/maintenance/${id}/complete`, data),
  submitFeedback: (id: string, rating: number, feedback?: string) =>
    api.post(`/maintenance/${id}/feedback`, { rating, feedback }),
  getStats: () => api.get('/maintenance/stats/summary'),
};

// Listings (Public)
export const listingAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  getOne: (id: string) => api.get(`/listings/${id}`),
  getFeatured: () => api.get('/listings/featured'),
  getUnits: (id: string) => api.get(`/listings/${id}/units`),
};

// Settings
export const settingsAPI = {
  // Owner payment settings
  getPaymentSettings: () => api.get('/settings/payment'),
  updatePaymentSettings: (data: {
    preferredPaymentMethod?: string;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountHolderName: string;
    };
    paymentInstructions?: string;
    isActive?: boolean;
  }) => api.put('/settings/payment', data),
  // Get supported banks
  getSupportedBanks: () => api.get('/settings/banks'),
  // Tenant access to owner's payment info
  getOwnerPaymentInfo: (ownerId: string) => api.get(`/settings/owner/${ownerId}/payment-info`),
};

// Payment Calendar
export const calendarAPI = {
  getPaymentCalendar: (params: { year: number; month: number }) =>
    api.get('/payments/calendar', { params }),
  getPaymentReminders: () => api.get('/payments/reminders'),
};

// Payment Schedules
export const scheduleAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    tenantId?: string;
    propertyId?: string;
    type?: string;
    isActive?: boolean;
  }) => api.get('/schedules', { params }),
  getOne: (id: string) => api.get(`/schedules/${id}`),
  create: (data: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    type: 'rent' | 'utility' | 'maintenance' | 'custom';
    name: string;
    amount: number;
    recurrence?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
    dayOfMonth: number;
    startDate: string;
    endDate?: string;
    autoGenerate?: boolean;
    generateAheadMonths?: number;
  }) => api.post('/schedules', data),
  update: (id: string, data: {
    name?: string;
    amount?: number;
    recurrence?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
    dayOfMonth?: number;
    endDate?: string;
    isActive?: boolean;
    autoGenerate?: boolean;
    generateAheadMonths?: number;
  }) => api.put(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  getForTenant: (tenantId: string) => api.get(`/schedules/tenant/${tenantId}`),
  generatePayments: (id: string) => api.post(`/schedules/${id}/generate`),
};

// Notifications
export const notificationAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
  }) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Listing Promotions
export const promotionAPI = {
  getAll: () => api.get('/promotions'),
  create: (data: { propertyId: string; type: string; durationDays?: number }) =>
    api.post('/promotions', data),
  cancel: (id: string) => api.delete(`/promotions/${id}`),
  getFeatured: () => api.get('/promotions/featured'),
  trackClick: (id: string) => api.post(`/promotions/${id}/click`),
};

export default api;
