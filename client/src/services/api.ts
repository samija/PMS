import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { Property, Unit, Tenant, MaintenanceRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Handle auth errors with single retry before logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        return await api.request(originalRequest);
      } catch (retryError) {
        useAuthStore.getState().logout();
        return Promise.reject(retryError);
      }
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { name?: string; phone?: string }) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// Properties
export const propertyAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string }) => api.get('/properties', { params }),
  getOne: (id: string) => api.get(`/properties/${id}`),
  create: (data: Omit<Property, '_id' | 'createdAt' | 'updatedAt'>) => api.post('/properties', data),
  update: (id: string, data: Partial<Omit<Property, '_id' | 'createdAt' | 'updatedAt'>>) =>
    api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  toggleListing: (id: string) => api.patch(`/properties/${id}/listing`),
  // Units
  addUnit: (propertyId: string, data: Omit<Unit, '_id' | 'propertyId'>) =>
    api.post(`/properties/${propertyId}/units`, data),
  getUnits: (
    propertyId: string,
    params?: { status?: string; type?: string; floor?: number; page?: number; limit?: number }
  ) => api.get(`/properties/${propertyId}/units`, { params }),
  updateUnit: (propertyId: string, unitId: string, data: Partial<Omit<Unit, '_id' | 'propertyId'>>) =>
    api.put(`/properties/${propertyId}/units/${unitId}`, data),
  deleteUnit: (propertyId: string, unitId: string) => api.delete(`/properties/${propertyId}/units/${unitId}`),
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
  create: (data: Omit<Tenant, '_id' | 'createdAt' | 'documents' | 'status'>) => api.post('/tenants', data),
  update: (id: string, data: Partial<Omit<Tenant, '_id' | 'createdAt'>>) => api.put(`/tenants/${id}`, data),
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
  deleteDocument: (tenantId: string, documentId: string) => api.delete(`/tenants/${tenantId}/documents/${documentId}`),
};

// Payments
export const paymentAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    tenantId?: string;
    propertyId?: string;
  }) => api.get('/payments', { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  initialize: (data: {
    tenantId: string;
    amount: number;
    type: string;
    month: number;
    year: number;
    dueDate?: string;
  }) => api.post('/payments/initialize', data),
  verify: (txRef: string) => api.get(`/payments/verify/${txRef}`),
  createManual: (data: {
    tenantId: string;
    amount: number;
    type: string;
    month: number;
    year: number;
    dueDate?: string;
    paymentMethod?: string;
  }) => api.post('/payments/manual', data),
  getStats: (year?: number) => api.get('/payments/stats/summary', { params: { year } }),
  // Bank transfer
  submitBankTransfer: (
    data: { tenantId: string; amount: number; type: string; month: number; year: number; dueDate?: string },
    receiptFile: File
  ) => {
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
  getPendingApproval: (params?: { page?: number; limit?: number; propertyId?: string }) =>
    api.get('/payments/pending-approval', { params }),
  approvePayment: (id: string, notes?: string) => api.patch(`/payments/${id}/approve`, { notes }),
  rejectPayment: (id: string, notes?: string) => api.patch(`/payments/${id}/reject`, { notes }),
};

// Waiting List
export const waitingListAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string; propertyId?: string; type?: string }) =>
    api.get('/waitlist', { params }),
  apply: (data: {
    propertyId: string;
    type: 'queue' | 'application';
    application?: { employmentInfo?: string; income?: number; references?: string[] };
  }) => api.post('/waitlist/apply', data),
  offerUnit: (id: string, data: { unitId: string; expiresInDays?: number }) => api.post(`/waitlist/${id}/offer`, data),
  respond: (id: string, accept: boolean) => api.post(`/waitlist/${id}/respond`, { accept }),
  updateStatus: (id: string, status: string) => api.patch(`/waitlist/${id}/status`, { status }),
  getMyApplications: () => api.get('/waitlist/my-applications'),
};

// Maintenance
export const maintenanceAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    propertyId?: string;
    category?: string;
    sort?: string;
  }) => api.get('/maintenance', { params }),
  getOne: (id: string) => api.get(`/maintenance/${id}`),
  create: (
    data: Pick<MaintenanceRequest, 'title' | 'description' | 'category' | 'priority'> & {
      propertyId: string;
      unitId: string;
      images?: string[];
    }
  ) => api.post('/maintenance', data),
  updateStatus: (id: string, status: string, note?: string) => api.patch(`/maintenance/${id}/status`, { status, note }),
  assign: (id: string, data: { assignedTo: string; scheduledDate?: string; estimatedCost?: number }) =>
    api.post(`/maintenance/${id}/assign`, data),
  complete: (id: string, data: { actualCost?: number; completionImages?: string[]; note?: string }) =>
    api.post(`/maintenance/${id}/complete`, data),
  submitFeedback: (id: string, rating: number, feedback?: string) =>
    api.post(`/maintenance/${id}/feedback`, { rating, feedback }),
  getStats: () => api.get('/maintenance/stats/summary'),
};

// Listings (Public)
export const listingAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    type?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => api.get('/listings', { params }),
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
  getPaymentCalendar: (params: { year: number; month: number }) => api.get('/payments/calendar', { params }),
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
  update: (
    id: string,
    data: {
      name?: string;
      amount?: number;
      recurrence?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
      dayOfMonth?: number;
      endDate?: string;
      isActive?: boolean;
      autoGenerate?: boolean;
      generateAheadMonths?: number;
    }
  ) => api.put(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  getForTenant: (tenantId: string) => api.get(`/schedules/tenant/${tenantId}`),
  generatePayments: (id: string) => api.post(`/schedules/${id}/generate`),
};

// Notifications
export const notificationAPI = {
  getAll: (params?: { page?: number; limit?: number; type?: string; isRead?: boolean }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Listing Promotions
export const promotionAPI = {
  getAll: () => api.get('/promotions'),
  create: (data: { propertyId: string; type: string; durationDays?: number }) => api.post('/promotions', data),
  cancel: (id: string) => api.delete(`/promotions/${id}`),
  getFeatured: () => api.get('/promotions/featured'),
  trackClick: (id: string) => api.post(`/promotions/${id}/click`),
};

// ==================== Identity Management ====================
export const identityAPI = {
  get: (tenantId: string) => api.get(`/tenants/${tenantId}/identity`),
  update: (tenantId: string, data: { idType?: string; idNumber?: string; idExpiry?: string; nationality?: string }) =>
    api.put(`/tenants/${tenantId}/identity`, data),
  setVerificationStatus: (tenantId: string, data: { status: string; reasonCode?: string; reasonText?: string }) =>
    api.post(`/tenants/${tenantId}/identity/verify`, data),
};

// ==================== Document Management v2 ====================
export const documentV2API = {
  upload: (
    tenantId: string,
    file: File,
    meta: {
      type: string;
      name: string;
      issueDate?: string;
      expiryDate?: string;
      documentNumber?: string;
      issuingCountry?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('document', file);
    Object.entries(meta).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });
    return api.post(`/v2/tenants/${tenantId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (tenantId: string, params?: { type?: string; verificationStatus?: string }) =>
    api.get(`/v2/tenants/${tenantId}/documents`, { params }),
  getSignedUrl: (docId: string) => api.get(`/v2/documents/${docId}/signed-url`),
  verify: (docId: string) => api.post(`/v2/documents/${docId}/verify`),
  reject: (docId: string, data: { reasonCode: string; reasonText?: string }) =>
    api.post(`/v2/documents/${docId}/reject`, data),
  delete: (docId: string) => api.delete(`/v2/documents/${docId}`),
};

// ==================== Lease Templates ====================
export const leaseTemplateAPI = {
  getAll: () => api.get('/lease-templates'),
  getOne: (id: string) => api.get(`/lease-templates/${id}`),
  create: (data: { name: string; content: string; variables?: string[]; propertyType?: string }) =>
    api.post('/lease-templates', data),
  update: (id: string, data: Partial<{ name: string; content: string; variables: string[]; propertyType: string }>) =>
    api.put(`/lease-templates/${id}`, data),
  delete: (id: string) => api.delete(`/lease-templates/${id}`),
};

// ==================== Lease Agreements ====================
export const leaseAPI = {
  getAll: () => api.get('/leases'),
  getOne: (id: string) => api.get(`/leases/${id}`),
  createDraft: (data: {
    tenantId: string;
    templateId?: string;
    terms?: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    deposit: number;
  }) => api.post('/leases', data),
  updateDraft: (
    id: string,
    data: Partial<{
      templateId: string;
      terms: string;
      startDate: string;
      endDate: string;
      monthlyRent: number;
      deposit: number;
    }>
  ) => api.put(`/leases/${id}`, data),
  submitForSignature: (id: string) => api.post(`/leases/${id}/submit-for-signature`),
  sign: (id: string, side: 'owner' | 'tenant') => api.post(`/leases/${id}/sign`, { side }),
  terminate: (id: string, data: { reasonCode: string; reasonText?: string }) =>
    api.post(`/leases/${id}/terminate`, data),
  renew: (id: string) => api.post(`/leases/${id}/renew`),
  amend: (
    id: string,
    data: Partial<{ terms: string; startDate: string; endDate: string; monthlyRent: number; deposit: number }>
  ) => api.post(`/leases/${id}/amend`, data),
};

// ==================== KYC Settings ====================
export const kycSettingsAPI = {
  get: () => api.get('/settings/kyc'),
  update: (data: {
    requireVerifiedIdentityToActivateTenant?: boolean;
    mandatoryKycDocuments?: string[];
    retentionYears?: number;
  }) => api.put('/settings/kyc', data),
};

// ==================== Audit Log ====================
export const auditAPI = {
  query: (params?: {
    tenantId?: string;
    entityType?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => api.get('/audit', { params }),
};

export default api;
