/**
 * Service Interfaces
 *
 * This file defines interfaces for all application services.
 * These interfaces define the contracts that services must implement,
 * enabling dependency injection and loose coupling.
 */

import { Types } from 'mongoose';
import {
  IUser,
  IProperty,
  IUnit,
  ITenant,
  IPayment,
  IMaintenance,
  IWaitingList,
  IOwnerPaymentSettings,
  UserRole,
  ILeaseAgreement,
  IEmergencyContact,
} from '../../types/index.js';
import { PaymentGatewayType } from './IPaymentGateway.js';

// ==================== Auth Service Interface ====================

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface IAuthService {
  register(data: RegisterData): Promise<AuthResponse>;
  login(data: LoginData): Promise<AuthResponse>;
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile>;
  generateAuthResponse(user: IUser): Promise<AuthResponse>;
}

// ==================== Property Service Interface ====================

export interface CreatePropertyData {
  ownerId: string;
  name: string;
  type: string;
  address: any;
  totalFloors: number;
  totalUnits: number;
  amenities?: string[];
  description?: string;
  waitingListType?: string;
  images?: string[];
}

export interface UpdatePropertyData {
  name?: string;
  type?: string;
  address?: any;
  totalFloors?: number;
  totalUnits?: number;
  amenities?: string[];
  description?: string;
  waitingListType?: string;
}

export interface CreateUnitData {
  propertyId: string;
  unitNumber: string;
  floor: number;
  type: string;
  size: number;
  basePrice: number;
  amenityCharges?: number;
  features?: string[];
  images?: string[];
}

export interface UpdateUnitData {
  unitNumber?: string;
  floor?: number;
  type?: string;
  size?: number;
  basePrice?: number;
  amenityCharges?: number;
  features?: string[];
  status?: string;
}

export interface PropertyQueryOptions {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export interface UnitQueryOptions {
  status?: string;
  floor?: number;
  type?: string;
}

export interface IPropertyService {
  createProperty(data: CreatePropertyData): Promise<IProperty>;
  getProperties(userId: string, userRole: UserRole, options?: PropertyQueryOptions): Promise<any>;
  getProperty(propertyId: string, userId: string): Promise<any>;
  updateProperty(propertyId: string, userId: string, data: UpdatePropertyData): Promise<IProperty>;
  deleteProperty(propertyId: string, userId: string): Promise<void>;
  toggleListing(propertyId: string, userId: string): Promise<IProperty>;
  addUnit(data: CreateUnitData): Promise<IUnit>;
  getUnits(propertyId: string, userId: string, options?: UnitQueryOptions): Promise<IUnit[]>;
  updateUnit(propertyId: string, unitId: string, userId: string, data: UpdateUnitData): Promise<IUnit>;
  deleteUnit(propertyId: string, unitId: string, userId: string): Promise<void>;
  addPropertyImages(propertyId: string, imageUrls: string[]): Promise<IProperty>;
  deletePropertyImage(propertyId: string, imageUrl: string): Promise<IProperty>;
  addUnitImages(propertyId: string, unitId: string, imageUrls: string[]): Promise<IUnit>;
  deleteUnitImage(propertyId: string, unitId: string, imageUrl: string): Promise<IUnit>;
}

// ==================== Tenant Service Interface ====================

export interface CreateTenantData {
  email: string;
  name: string;
  phone?: string;
  propertyId: string;
  unitId: string;
  ownerId: string;
  leaseAgreement: {
    startDate: Date | string;
    endDate: Date | string;
    monthlyRent: number;
    deposit: number;
    terms?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface UpdateTenantData {
  leaseAgreement?: Partial<ILeaseAgreement>;
  emergencyContact?: Partial<IEmergencyContact>;
  status?: string;
}

export interface TenantQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  propertyId?: string;
}

export interface ITenantService {
  createTenant(data: CreateTenantData): Promise<ITenant>;
  getTenants(ownerId: string, options?: TenantQueryOptions): Promise<any>;
  getTenant(tenantId: string, ownerId: string): Promise<ITenant>;
  updateTenant(tenantId: string, ownerId: string, data: UpdateTenantData): Promise<ITenant>;
  terminateTenant(tenantId: string, ownerId: string): Promise<ITenant>;
  getMyTenancy(userId: string): Promise<ITenant>;
}

// ==================== Payment Service Interface ====================

export interface InitializePaymentData {
  tenantId: string;
  amount: number;
  type: string;
  month: number;
  year: number;
  dueDate?: string;
  gateway?: PaymentGatewayType;
}

export interface InitializePaymentResult {
  payment: IPayment;
  checkoutUrl: string;
}

export interface CreateManualPaymentData {
  tenantId: string;
  ownerId: string;
  amount: number;
  type: string;
  month: number;
  year: number;
  dueDate?: string;
  notes?: string;
}

export interface PaymentQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  tenantId?: string;
  propertyId?: string;
  month?: number;
  year?: number;
  bankTransferApprovalStatus?: string;
}

export interface SubmitBankTransferData {
  tenantId: string;
  amount: number;
  type: string;
  month: number;
  year: number;
  dueDate?: string;
  receiptUrl: string;
}

export interface IPaymentService {
  initializePayment(data: InitializePaymentData): Promise<InitializePaymentResult>;
  verifyPayment(txRef: string): Promise<IPayment>;
  handleWebhook(gatewayType: PaymentGatewayType, data: any, signature?: string): Promise<void>;
  getPayments(userId: string, userRole: string, options?: PaymentQueryOptions): Promise<any>;
  getPayment(paymentId: string): Promise<IPayment>;
  createManualPayment(data: CreateManualPaymentData): Promise<IPayment>;
  submitBankTransfer(data: SubmitBankTransferData): Promise<IPayment>;
  approvePayment(paymentId: string, approverId: string, notes?: string): Promise<IPayment>;
  rejectPayment(paymentId: string, approverId: string, notes?: string): Promise<IPayment>;
  getPendingApprovalPayments(ownerId: string, options?: { page?: number; limit?: number }): Promise<any>;
  getPaymentStats(ownerId: string, year?: number): Promise<any>;
  getPaymentCalendar(userId: string, userRole: string, options: { year: number; month: number }): Promise<any>;
  getPaymentReminders(userId: string, userRole: string): Promise<any>;
}

// ==================== Maintenance Service Interface ====================

export interface CreateMaintenanceRequestData {
  userId: string;
  title: string;
  description: string;
  category: string;
  priority?: string;
  images?: string[];
}

export interface UpdateMaintenanceStatusData {
  requestId: string;
  userId: string;
  status: string;
  note?: string;
}

export interface AssignTechnicianData {
  requestId: string;
  ownerId: string;
  technicianId: string;
  scheduledDate?: string;
  estimatedCost?: number;
  note?: string;
}

export interface CompleteMaintenanceData {
  requestId: string;
  userId: string;
  actualCost?: number;
  completionImages?: string[];
  note?: string;
}

export interface SubmitFeedbackData {
  requestId: string;
  userId: string;
  rating: number;
  feedback?: string;
}

export interface MaintenanceQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  propertyId?: string;
}

export interface IMaintenanceService {
  createMaintenanceRequest(data: CreateMaintenanceRequestData): Promise<IMaintenance>;
  getMaintenanceRequests(userId: string, userRole: string, options?: MaintenanceQueryOptions): Promise<any>;
  getMaintenanceRequest(requestId: string): Promise<IMaintenance>;
  updateMaintenanceStatus(data: UpdateMaintenanceStatusData): Promise<IMaintenance>;
  assignTechnician(data: AssignTechnicianData): Promise<IMaintenance>;
  completeMaintenanceRequest(data: CompleteMaintenanceData): Promise<IMaintenance>;
  submitFeedback(data: SubmitFeedbackData): Promise<IMaintenance>;
  getMaintenanceStats(ownerId: string): Promise<any>;
}

// ==================== Waiting List Service Interface ====================

export interface ApplyToWaitingListData {
  applicantId: string;
  propertyId: string;
  unitId?: string;
  type?: string;
  application?: {
    employmentInfo?: string;
    income?: number;
    references?: string[];
    documents?: string[];
    notes?: string;
  };
}

export interface OfferUnitData {
  entryId: string;
  ownerId: string;
  unitId: string;
  expiresInDays?: number;
}

export interface RespondToOfferData {
  entryId: string;
  applicantId: string;
  accept: boolean;
}

export interface UpdateWaitingListStatusData {
  entryId: string;
  ownerId: string;
  status: string;
  notes?: string;
}

export interface WaitingListQueryOptions {
  propertyId?: string;
  unitId?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface IWaitingListService {
  applyToWaitingList(data: ApplyToWaitingListData): Promise<IWaitingList>;
  getWaitingList(ownerId: string, options?: WaitingListQueryOptions): Promise<any>;
  offerUnit(data: OfferUnitData): Promise<IWaitingList>;
  respondToOffer(data: RespondToOfferData): Promise<IWaitingList>;
  updateWaitingListStatus(data: UpdateWaitingListStatusData): Promise<IWaitingList>;
  getMyApplications(applicantId: string): Promise<IWaitingList[]>;
}

// ==================== Owner Settings Service Interface ====================

export interface UpdatePaymentSettingsData {
  preferredPaymentMethod?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  paymentInstructions?: string;
  isActive?: boolean;
}

export interface PublicPaymentInfo {
  preferredPaymentMethod: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  paymentInstructions?: string;
}

export interface IOwnerSettingsService {
  getPaymentSettings(ownerId: string): Promise<IOwnerPaymentSettings | null>;
  updatePaymentSettings(ownerId: string, data: UpdatePaymentSettingsData): Promise<IOwnerPaymentSettings>;
  getSettingsForTenant(ownerId: string): Promise<PublicPaymentInfo | null>;
  hasCompleteSettings(ownerId: string): Promise<boolean>;
}

// ==================== Email Reminder Service Interface ====================

export interface IEmailReminderService {
  processAllReminders(): Promise<void>;
  processUpcomingReminders(): Promise<{ sent: number; failed: number }>;
  processOverdueReminders(): Promise<{ sent: number; failed: number }>;
}

// ==================== Payment Schedule Service Interface ====================

import {
  IPaymentSchedule,
  INotification,
  IEmployee,
  IGuardShift,
  IAttendance,
  IIncident,
  ILeaveRequest,
  IPerformanceReview,
  IPayroll,
} from '../../types/index.js';

export interface CreateScheduleData {
  tenantId: string;
  propertyId: string;
  unitId: string;
  ownerId: string;
  type: 'rent' | 'utility' | 'maintenance' | 'custom';
  name: string;
  amount: number;
  recurrence: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  dayOfMonth: number;
  startDate: Date | string;
  endDate?: Date | string;
  autoGenerate?: boolean;
  generateAheadMonths?: number;
}

export interface UpdateScheduleData {
  name?: string;
  amount?: number;
  recurrence?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  dayOfMonth?: number;
  endDate?: Date | string;
  isActive?: boolean;
  autoGenerate?: boolean;
  generateAheadMonths?: number;
}

export interface ScheduleQueryOptions {
  page?: number;
  limit?: number;
  tenantId?: string;
  propertyId?: string;
  type?: string;
  isActive?: boolean;
}

export interface IPaymentScheduleService {
  createSchedule(data: CreateScheduleData): Promise<IPaymentSchedule>;
  getSchedules(ownerId: string, options?: ScheduleQueryOptions): Promise<any>;
  getSchedule(scheduleId: string, ownerId: string): Promise<IPaymentSchedule>;
  updateSchedule(scheduleId: string, ownerId: string, data: UpdateScheduleData): Promise<IPaymentSchedule>;
  deleteSchedule(scheduleId: string, ownerId: string): Promise<void>;
  getSchedulesForTenant(tenantId: string): Promise<IPaymentSchedule[]>;
  generatePaymentsForSchedule(scheduleId: string): Promise<IPayment[]>;
  generateAllPendingPayments(): Promise<{ generated: number; schedules: number }>;
  createDefaultScheduleForTenant(tenantId: string, ownerId: string, propertyId: string, unitId: string, monthlyRent: number, leaseStartDate: Date): Promise<IPaymentSchedule>;
}

// ==================== Notification Service Interface ====================

export interface CreateNotificationData {
  userId: string;
  type: 'payment_due' | 'payment_overdue' | 'payment_received' | 'payment_approved' | 'payment_rejected' | 'lease_expiring' | 'system';
  title: string;
  message: string;
  relatedEntity?: {
    type: 'payment' | 'tenant' | 'property' | 'schedule';
    id: string;
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: Date;
}

export interface NotificationQueryOptions {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}

export interface INotificationService {
  createNotification(data: CreateNotificationData): Promise<INotification>;
  getNotifications(userId: string, options?: NotificationQueryOptions): Promise<any>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<INotification>;
  markAllAsRead(userId: string): Promise<{ modified: number }>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
  deleteOldReadNotifications(daysOld?: number): Promise<number>;
  notifyPaymentDue(payment: IPayment, daysUntilDue: number): Promise<void>;
  notifyPaymentOverdue(payment: IPayment, daysOverdue: number): Promise<void>;
  notifyPaymentReceived(payment: IPayment): Promise<void>;
  notifyPaymentApproved(payment: IPayment): Promise<void>;
  notifyPaymentRejected(payment: IPayment, reason?: string): Promise<void>;
}

// ==================== Employee Service Interface ====================

export interface CreateEmployeeData {
  userId: string;
  personalInfo?: {
    dateOfBirth?: Date;
    gender?: string;
    nationalId?: string;
    address?: string;
    city?: string;
    emergencyContact?: { name: string; phone: string; relationship: string };
  };
  employment: {
    position: string;
    department: string;
    employmentType?: string;
    startDate: Date | string;
    endDate?: Date | string;
  };
  salary: {
    baseSalary: number;
    currency?: string;
    paymentFrequency?: string;
    bankName?: string;
    bankAccountNumber?: string;
  };
}

export interface UpdateEmployeeData {
  personalInfo?: Partial<CreateEmployeeData['personalInfo']>;
  employment?: Partial<CreateEmployeeData['employment']>;
  salary?: Partial<CreateEmployeeData['salary']>;
}

export interface EmployeeQueryOptions {
  page?: number;
  limit?: number;
  department?: string;
  status?: string;
  search?: string;
}

export interface IEmployeeService {
  createEmployee(data: CreateEmployeeData): Promise<IEmployee>;
  getEmployees(options?: EmployeeQueryOptions): Promise<any>;
  getEmployee(id: string): Promise<IEmployee>;
  updateEmployee(id: string, data: UpdateEmployeeData): Promise<IEmployee>;
  updateEmployeeStatus(id: string, status: string): Promise<IEmployee>;
  addDocument(id: string, document: { type: string; url: string }): Promise<IEmployee>;
}

// ==================== Guard Service Interface ====================

export interface CreateGuardShiftData {
  propertyId: string;
  guardId: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  guardPost: string;
  assignedBy: string;
  effectiveFrom: Date | string;
  effectiveTo?: Date | string;
  notes?: string;
}

export interface UpdateGuardShiftData {
  shiftType?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  guardPost?: string;
  isActive?: boolean;
  effectiveTo?: Date | string;
  notes?: string;
}

export interface IGuardService {
  createShift(data: CreateGuardShiftData): Promise<IGuardShift>;
  getShifts(propertyId: string, options?: { guardId?: string; isActive?: boolean }): Promise<IGuardShift[]>;
  updateShift(propertyId: string, shiftId: string, data: UpdateGuardShiftData): Promise<IGuardShift>;
  deleteShift(propertyId: string, shiftId: string): Promise<void>;
  getWeeklySchedule(propertyId: string): Promise<any>;
  getGuardPosts(propertyId: string): Promise<any>;
}

// ==================== Attendance Service Interface ====================

export interface CheckInData {
  employeeId: string;
  propertyId: string;
  shiftId?: string;
  notes?: string;
  recordedBy: string;
}

export interface CheckOutData {
  employeeId: string;
  propertyId: string;
  notes?: string;
}

export interface AttendanceQueryOptions {
  page?: number;
  limit?: number;
  date?: string;
  status?: string;
  employeeId?: string;
}

export interface IAttendanceService {
  checkIn(data: CheckInData): Promise<IAttendance>;
  checkOut(data: CheckOutData): Promise<IAttendance>;
  getDailyAttendance(propertyId: string, date?: string): Promise<IAttendance[]>;
  getMonthlyReport(propertyId: string, month: number, year: number): Promise<any>;
  getEmployeeAttendance(employeeId: string, options?: AttendanceQueryOptions): Promise<any>;
}

// ==================== Incident Service Interface ====================

export interface CreateIncidentData {
  propertyId: string;
  reportedBy: string;
  incidentType: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  occurredAt: Date | string;
  witnesses?: string[];
  images?: string[];
  policeReportFiled?: boolean;
  policeReportNumber?: string;
}

export interface UpdateIncidentData {
  incidentType?: string;
  severity?: string;
  title?: string;
  description?: string;
  location?: string;
  witnesses?: string[];
  images?: string[];
  policeReportFiled?: boolean;
  policeReportNumber?: string;
}

export interface IncidentQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  incidentType?: string;
}

export interface IIncidentService {
  reportIncident(data: CreateIncidentData): Promise<IIncident>;
  getIncidents(propertyId: string, options?: IncidentQueryOptions): Promise<any>;
  getIncident(propertyId: string, id: string): Promise<IIncident>;
  updateIncident(propertyId: string, id: string, data: UpdateIncidentData): Promise<IIncident>;
  updateIncidentStatus(propertyId: string, id: string, status: string, resolution?: string, resolvedBy?: string): Promise<IIncident>;
}

// ==================== Leave Service Interface ====================

export interface CreateLeaveRequestData {
  employeeId: string;
  propertyId: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  documents?: string[];
}

export interface ILeaveService {
  submitRequest(data: CreateLeaveRequestData): Promise<ILeaveRequest>;
  getRequests(options?: { employeeId?: string; propertyId?: string; status?: string; page?: number; limit?: number }): Promise<any>;
  approveRequest(id: string, approvedBy: string): Promise<ILeaveRequest>;
  rejectRequest(id: string, rejectedBy: string, reason: string): Promise<ILeaveRequest>;
  cancelRequest(id: string, employeeId: string): Promise<ILeaveRequest>;
  getLeaveBalance(employeeId: string): Promise<any>;
}

// ==================== Payroll Service Interface ====================

export interface GeneratePayrollData {
  propertyId: string;
  month: number;
  year: number;
}

export interface IPayrollService {
  generatePayroll(data: GeneratePayrollData): Promise<IPayroll[]>;
  getPayrollRecords(propertyId: string, options?: { month?: number; year?: number; status?: string; page?: number; limit?: number }): Promise<any>;
  getPayrollDetail(propertyId: string, id: string): Promise<IPayroll>;
  approvePayroll(propertyId: string, id: string, approvedBy: string): Promise<IPayroll>;
  markAsPaid(propertyId: string, id: string, paidBy: string, paymentMethod: string, transactionRef?: string): Promise<IPayroll>;
}

// ==================== Performance Service Interface ====================

export interface CreatePerformanceReviewData {
  employeeId: string;
  propertyId: string;
  reviewerId: string;
  reviewPeriod: { startDate: Date | string; endDate: Date | string };
  ratings: {
    punctuality: number;
    workQuality: number;
    teamwork: number;
    communication: number;
    reliability: number;
  };
  strengths: string;
  improvements: string;
  comments: string;
}

export interface UpdatePerformanceReviewData {
  ratings?: Partial<CreatePerformanceReviewData['ratings']>;
  strengths?: string;
  improvements?: string;
  comments?: string;
  employeeComments?: string;
}

export interface IPerformanceService {
  createReview(data: CreatePerformanceReviewData): Promise<IPerformanceReview>;
  getReviews(propertyId: string, options?: { employeeId?: string; page?: number; limit?: number }): Promise<any>;
  getReview(propertyId: string, id: string): Promise<IPerformanceReview>;
  updateReview(propertyId: string, id: string, data: UpdatePerformanceReviewData): Promise<IPerformanceReview>;
  submitReview(propertyId: string, id: string): Promise<IPerformanceReview>;
}
