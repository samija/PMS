import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User types
export type UserRole = 'owner' | 'tenant' | 'admin' | 'technician' | 'marketing' | 'manager' | 'guard' | 'cleaner';
export type AuthProvider = 'local' | 'google';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;
  isVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Property types
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'villa';
export type ListingStatus = 'available' | 'occupied' | 'maintenance';
export type WaitingListType = 'queue' | 'application' | 'both';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IProperty extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  type: PropertyType;
  address: IAddress;
  totalFloors: number;
  totalUnits: number;
  amenities: string[];
  images: string[];
  description?: string;
  isListed: boolean;
  listingStatus: ListingStatus;
  waitingListType: WaitingListType;
  createdAt: Date;
  updatedAt: Date;
}

// Unit types
export type UnitType = 'studio' | '1bed' | '2bed' | '3bed' | 'office' | 'shop' | 'warehouse';
export type UnitStatus = 'vacant' | 'occupied' | 'reserved' | 'maintenance';

export interface IPricing {
  basePrice: number;
  floorMultiplier: number;
  amenityCharges: number;
  totalPrice: number;
}

export interface IUnit extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitNumber: string;
  floor: number;
  type: UnitType;
  size: number; // in square meters
  pricing: IPricing;
  status: UnitStatus;
  features: string[];
  images: string[];
  currentTenantId?: Types.ObjectId;
  leaseStart?: Date;
  leaseEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tenant types
export type TenantStatus = 'active' | 'pending' | 'terminated';

export interface ILeaseAgreement {
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  terms?: string;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export type DocumentType = 'agreement' | 'national_id' | 'passport' | 'other';

export interface ITenantDocument {
  _id?: Types.ObjectId;
  url: string;
  type: DocumentType;
  name: string;
  uploadedAt: Date;
}

export interface ITenant extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitId: Types.ObjectId;
  ownerId: Types.ObjectId;
  leaseAgreement: ILeaseAgreement;
  emergencyContact?: IEmergencyContact;
  documents: ITenantDocument[];
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export type PaymentType = 'rent' | 'deposit' | 'maintenance' | 'utility' | 'penalty' | 'custom';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethodType = 'chapa' | 'telebirr' | 'santimpay' | 'manual' | 'bank_transfer';
export type BankTransferApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export interface IReceipt {
  number: string;
  generatedAt: Date;
  url?: string;
}

// Payment Schedule types
export type ScheduleType = 'rent' | 'utility' | 'maintenance' | 'custom';
export type RecurrenceType = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

export interface IPaymentSchedule extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitId: Types.ObjectId;
  ownerId: Types.ObjectId;
  type: ScheduleType;
  name: string;
  amount: number;
  recurrence: RecurrenceType;
  dayOfMonth: number; // 1-28
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  autoGenerate: boolean;
  generateAheadMonths: number; // default: 3
  lastGeneratedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export type NotificationType = 'payment_due' | 'payment_overdue' | 'payment_received' | 'payment_approved' | 'payment_rejected' | 'lease_expiring' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface IRelatedEntity {
  type: 'payment' | 'tenant' | 'property' | 'schedule';
  id: Types.ObjectId;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity?: IRelatedEntity;
  isRead: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment reminder sent record
export interface IReminderSent {
  type: 'due' | 'overdue' | 'upcoming';
  sentAt: Date;
  daysBeforeDue: number;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  unitId: Types.ObjectId;
  propertyId: Types.ObjectId;
  ownerId: Types.ObjectId;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;

  // Schedule reference (for auto-generated payments)
  scheduleId?: Types.ObjectId;
  isAutoGenerated?: boolean;
  remindersSent?: IReminderSent[];

  // Generic gateway fields (new)
  gatewayReference?: string;
  gatewayTransactionRef?: string;
  gatewayMetadata?: Record<string, any>;

  // Legacy Chapa fields (for backward compatibility)
  chapaReference?: string;
  chapaTxRef?: string;

  dueDate: Date;
  paidAt?: Date;
  month: number;
  year: number;
  receipt?: IReceipt;
  // Bank transfer fields
  bankTransferReceipt?: string;
  bankTransferApprovalStatus?: BankTransferApprovalStatus;
  bankTransferApprovalNotes?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// WaitingList types
export type WaitingListStatus = 'waiting' | 'offered' | 'accepted' | 'rejected' | 'expired';

export interface IApplication {
  employmentInfo?: string;
  income?: number;
  references?: string[];
  documents?: string[];
  notes?: string;
}

export interface IWaitingList extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitId?: Types.ObjectId;
  applicantId: Types.ObjectId;
  type: 'queue' | 'application';
  position?: number;
  application?: IApplication;
  status: WaitingListStatus;
  appliedAt: Date;
  offeredAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Maintenance types
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'appliance' | 'structural' | 'hvac' | 'other';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency';
export type MaintenanceStatus = 'submitted' | 'acknowledged' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface ITimelineEntry {
  status: MaintenanceStatus;
  timestamp: Date;
  note?: string;
  updatedBy: Types.ObjectId;
}

export interface IMaintenance extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitId: Types.ObjectId;
  tenantId: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: Types.ObjectId;
  images: string[];
  completionImages: string[];
  estimatedCost?: number;
  actualCost?: number;
  timeline: ITimelineEntry[];
  scheduledDate?: Date;
  completedAt?: Date;
  tenantRating?: number;
  tenantFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// PropertyStaff types
export type StaffRole = 'manager' | 'marketing' | 'technician' | 'guard' | 'cleaner';
export type StaffPermission = 'view' | 'edit' | 'delete' | 'manage_staff' | 'manage_tenants' | 'manage_maintenance';

export interface IPropertyStaff extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  userId: Types.ObjectId;
  role: StaffRole;
  assignedBy: Types.ObjectId;
  permissions: StaffPermission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Owner Payment Settings types
export type PreferredPaymentMethod = 'chapa' | 'telebirr' | 'santimpay' | 'bank_transfer';

export type EthiopianBank =
  | 'CBE'
  | 'Awash Bank'
  | 'Dashen Bank'
  | 'Bank of Abyssinia'
  | 'Wegagen Bank'
  | 'United Bank'
  | 'Nib International Bank'
  | 'Zemen Bank'
  | 'Cooperative Bank of Oromia'
  | 'Abay Bank'
  | 'Berhan Bank'
  | 'Bunna International Bank';

export interface IBankDetails {
  bankName: EthiopianBank;
  accountNumber: string;
  accountHolderName: string;
}

export interface IOwnerPaymentSettings extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  preferredPaymentMethod: PreferredPaymentMethod;
  bankDetails?: IBankDetails;
  paymentInstructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Express Request with User
export interface AuthRequest extends Request {
  user?: IUser;
  property?: IProperty;
  staffAssignment?: IPropertyStaff;
  accessLevel?: 'owner' | 'manager' | 'marketing' | 'technician' | 'guard' | 'cleaner' | 'admin';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ==================== Employee types ====================
export type EmploymentDepartment = 'security' | 'maintenance' | 'cleaning' | 'management' | 'marketing';
export type EmploymentType = 'full_time' | 'part_time' | 'contract';
export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';
export type PaymentFrequency = 'monthly' | 'biweekly' | 'weekly';
export type Gender = 'male' | 'female';

export interface IEmergencyContactInfo {
  name: string;
  phone: string;
  relationship: string;
}

export interface IPersonalInfo {
  dateOfBirth?: Date;
  gender?: Gender;
  nationalId?: string;
  address?: string;
  city?: string;
  emergencyContact?: IEmergencyContactInfo;
}

export interface IEmploymentInfo {
  position: string;
  department: EmploymentDepartment;
  employmentType: EmploymentType;
  startDate: Date;
  endDate?: Date;
  status: EmploymentStatus;
}

export interface ISalaryInfo {
  baseSalary: number;
  currency: string;
  paymentFrequency: PaymentFrequency;
  bankName?: EthiopianBank;
  bankAccountNumber?: string;
}

export interface IEmployeeDocument {
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  employeeId: string;
  personalInfo: IPersonalInfo;
  employment: IEmploymentInfo;
  salary: ISalaryInfo;
  documents: IEmployeeDocument[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Guard Shift types ====================
export type ShiftType = 'morning' | 'afternoon' | 'night';
export type GuardPost = 'main_gate' | 'back_gate' | 'parking' | 'lobby' | 'patrol' | 'rooftop' | 'basement';

export interface IGuardShift extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  guardId: Types.ObjectId;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  guardPost: GuardPost;
  isActive: boolean;
  assignedBy: Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Attendance types ====================
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  propertyId: Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  shiftId?: Types.ObjectId;
  hoursWorked?: number;
  overtime?: number;
  notes?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Incident types ====================
export type IncidentType = 'theft' | 'vandalism' | 'unauthorized_access' | 'disturbance' | 'fire' | 'flood' | 'medical' | 'suspicious_activity' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'closed';

export interface IIncident extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: string;
  occurredAt: Date;
  status: IncidentStatus;
  resolution?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  witnesses: string[];
  images: string[];
  policeReportFiled: boolean;
  policeReportNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Leave Request types ====================
export type LeaveType = 'annual' | 'sick' | 'personal' | 'emergency' | 'maternity' | 'paternity' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ILeaveRequest extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  propertyId: Types.ObjectId;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Performance Review types ====================
export type ReviewStatus = 'draft' | 'submitted' | 'acknowledged';

export interface IRatings {
  punctuality: number;
  workQuality: number;
  teamwork: number;
  communication: number;
  reliability: number;
  overall: number;
}

export interface IReviewPeriod {
  startDate: Date;
  endDate: Date;
}

export interface IPerformanceReview extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  propertyId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  reviewPeriod: IReviewPeriod;
  ratings: IRatings;
  strengths: string;
  improvements: string;
  comments: string;
  employeeComments?: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Payroll types ====================
export type PayrollStatus = 'draft' | 'approved' | 'paid';
export type DeductionType = 'tax' | 'pension' | 'absence' | 'other';
export type PayrollPaymentMethod = 'bank_transfer' | 'cash' | 'chapa';

export interface IOvertimeInfo {
  hours: number;
  rate: number;
  amount: number;
}

export interface IDeduction {
  type: DeductionType;
  description: string;
  amount: number;
}

export interface IBonus {
  description: string;
  amount: number;
}

export interface IPayrollPeriod {
  month: number;
  year: number;
}

export interface IPayroll extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  propertyId: Types.ObjectId;
  period: IPayrollPeriod;
  baseSalary: number;
  overtime: IOvertimeInfo;
  deductions: IDeduction[];
  bonuses: IBonus[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
  paidAt?: Date;
  paidBy?: Types.ObjectId;
  paymentMethod: PayrollPaymentMethod;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}
