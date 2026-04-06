/**
 * Repository Interfaces
 *
 * This file defines interfaces for all repository classes.
 * These interfaces extend the base IRepository interface with entity-specific methods.
 */

import { Types, Document, FilterQuery, UpdateQuery } from 'mongoose';
import {
  IUser,
  IProperty,
  IUnit,
  ITenant,
  IPayment,
  IMaintenance,
  IWaitingList,
  UserRole,
  AuthProvider,
  PropertyType,
  ListingStatus,
  WaitingListType,
  UnitStatus,
  UnitType,
  TenantStatus,
  PaymentStatus,
  PaymentType,
  PaymentMethodType,
  BankTransferApprovalStatus,
  MaintenanceStatus,
  MaintenanceCategory,
  MaintenancePriority,
  WaitingListStatus,
  IPricing,
  ILeaseAgreement,
  IEmergencyContact,
  IApplication,
  ITimelineEntry,
} from '../../types/index.js';
import { IRepository, PaginationOptions, PaginatedResult, QueryOptions } from './IRepository.js';

// ==================== User Repository Interface ====================

export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string, includePassword?: boolean): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  findByRole(role: UserRole): Promise<IUser[]>;
  findByRoles(roles: UserRole[]): Promise<IUser[]>;
  findByAuthProvider(provider: AuthProvider): Promise<IUser[]>;
  findVerified(): Promise<IUser[]>;
  findUnverified(): Promise<IUser[]>;
  emailExists(email: string): Promise<boolean>;
  updateVerificationStatus(userId: string | Types.ObjectId, isVerified: boolean): Promise<IUser | null>;
  updateProfile(userId: string | Types.ObjectId, data: { name?: string; phone?: string; avatar?: string }): Promise<IUser | null>;
  updatePassword(userId: string | Types.ObjectId, password: string): Promise<IUser | null>;
  search(searchTerm: string, role?: UserRole): Promise<IUser[]>;
  createOAuthUser(data: { email: string; name: string; googleId: string; avatar?: string; role?: UserRole }): Promise<IUser>;
  findOrCreateByGoogleId(googleId: string, data: { email: string; name: string; avatar?: string }): Promise<IUser>;
  getCountByRole(): Promise<Record<UserRole, number>>;
}

// ==================== Property Repository Interface ====================

export interface PropertyFilterOptions {
  ownerId?: string | Types.ObjectId;
  type?: PropertyType;
  listingStatus?: ListingStatus;
  isListed?: boolean;
  city?: string;
  state?: string;
}

export interface IPropertyRepository extends IRepository<IProperty> {
  findByOwner(ownerId: string | Types.ObjectId): Promise<IProperty[]>;
  findByOwnerWithPagination(ownerId: string | Types.ObjectId, pagination: PaginationOptions): Promise<PaginatedResult<IProperty>>;
  findByIdAndOwner(propertyId: string | Types.ObjectId, ownerId: string | Types.ObjectId): Promise<IProperty | null>;
  findListed(options?: Omit<PropertyFilterOptions, 'isListed'>): Promise<IProperty[]>;
  findListedWithPagination(pagination: PaginationOptions, options?: Omit<PropertyFilterOptions, 'isListed'>): Promise<PaginatedResult<IProperty>>;
  findByType(type: PropertyType): Promise<IProperty[]>;
  findByListingStatus(status: ListingStatus): Promise<IProperty[]>;
  findByCity(city: string, isListed?: boolean): Promise<IProperty[]>;
  findNearby(lat: number, lng: number, radiusKm: number): Promise<IProperty[]>;
  toggleListing(propertyId: string | Types.ObjectId, ownerId: string | Types.ObjectId): Promise<IProperty | null>;
  updateListingStatus(propertyId: string | Types.ObjectId, status: ListingStatus): Promise<IProperty | null>;
  updateWaitingListType(propertyId: string | Types.ObjectId, type: WaitingListType): Promise<IProperty | null>;
  addImages(propertyId: string | Types.ObjectId, imageUrls: string[]): Promise<IProperty | null>;
  removeImage(propertyId: string | Types.ObjectId, imageUrl: string): Promise<IProperty | null>;
  updateAmenities(propertyId: string | Types.ObjectId, amenities: string[]): Promise<IProperty | null>;
  search(searchTerm: string, isListed?: boolean): Promise<IProperty[]>;
  getStatsByOwner(ownerId: string | Types.ObjectId): Promise<{
    total: number;
    listed: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
  findWithAvailableUnits(ownerId?: string | Types.ObjectId): Promise<Types.ObjectId[]>;
}

// ==================== Unit Repository Interface ====================

export interface UnitFilterOptions {
  propertyId?: string | Types.ObjectId;
  status?: UnitStatus;
  type?: UnitType;
  floor?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface IUnitRepository extends IRepository<IUnit> {
  findByProperty(propertyId: string | Types.ObjectId, options?: Omit<UnitFilterOptions, 'propertyId'>): Promise<IUnit[]>;
  findByPropertyAndUnitNumber(propertyId: string | Types.ObjectId, unitNumber: string): Promise<IUnit | null>;
  findVacant(propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findOccupied(propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findReserved(propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findUnderMaintenance(propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findByStatus(status: UnitStatus, propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findByType(type: UnitType, propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findByFloor(floor: number, propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  findByTenant(tenantId: string | Types.ObjectId): Promise<IUnit | null>;
  findWithExpiringLeases(daysUntilExpiry: number, propertyId?: string | Types.ObjectId): Promise<IUnit[]>;
  updateStatus(unitId: string | Types.ObjectId, status: UnitStatus): Promise<IUnit | null>;
  updatePricing(unitId: string | Types.ObjectId, pricing: IPricing): Promise<IUnit | null>;
  assignTenant(unitId: string | Types.ObjectId, tenantId: string | Types.ObjectId, leaseStart: Date, leaseEnd: Date): Promise<IUnit | null>;
  removeTenant(unitId: string | Types.ObjectId): Promise<IUnit | null>;
  addImages(unitId: string | Types.ObjectId, imageUrls: string[]): Promise<IUnit | null>;
  removeImage(unitId: string | Types.ObjectId, imageUrl: string): Promise<IUnit | null>;
  updateFeatures(unitId: string | Types.ObjectId, features: string[]): Promise<IUnit | null>;
  getStatsByProperty(propertyId: string | Types.ObjectId): Promise<{
    total: number;
    byStatus: Record<UnitStatus, number>;
    byType: Record<string, number>;
    byFloor: Record<number, number>;
    averagePrice: number;
    occupancyRate: number;
  }>;
  deleteByProperty(propertyId: string | Types.ObjectId): Promise<number>;
  unitNumberExists(propertyId: string | Types.ObjectId, unitNumber: string, excludeUnitId?: string | Types.ObjectId): Promise<boolean>;
}

// ==================== Tenant Repository Interface ====================

export interface TenantFilterOptions {
  ownerId?: string | Types.ObjectId;
  propertyId?: string | Types.ObjectId;
  unitId?: string | Types.ObjectId;
  status?: TenantStatus;
}

export interface ITenantRepository extends IRepository<ITenant> {
  findByOwnerWithPagination(ownerId: string | Types.ObjectId, pagination: PaginationOptions, options?: Omit<TenantFilterOptions, 'ownerId'>): Promise<PaginatedResult<ITenant>>;
  findByIdWithDetails(tenantId: string | Types.ObjectId, ownerId?: string | Types.ObjectId): Promise<ITenant | null>;
  findByUserId(userId: string | Types.ObjectId, status?: TenantStatus): Promise<ITenant | null>;
  findActiveByUserId(userId: string | Types.ObjectId): Promise<ITenant | null>;
  findByProperty(propertyId: string | Types.ObjectId, status?: TenantStatus): Promise<ITenant[]>;
  findByUnit(unitId: string | Types.ObjectId, status?: TenantStatus): Promise<ITenant | null>;
  findByOwner(ownerId: string | Types.ObjectId, status?: TenantStatus): Promise<ITenant[]>;
  findActiveByOwner(ownerId: string | Types.ObjectId): Promise<ITenant[]>;
  findWithExpiringLeases(daysUntilExpiry: number, ownerId?: string | Types.ObjectId): Promise<ITenant[]>;
  findWithExpiredLeases(ownerId?: string | Types.ObjectId): Promise<ITenant[]>;
  updateStatus(tenantId: string | Types.ObjectId, status: TenantStatus): Promise<ITenant | null>;
  terminate(tenantId: string | Types.ObjectId, ownerId: string | Types.ObjectId): Promise<ITenant | null>;
  updateLeaseAgreement(tenantId: string | Types.ObjectId, leaseData: Partial<ILeaseAgreement>): Promise<ITenant | null>;
  updateEmergencyContact(tenantId: string | Types.ObjectId, contactData: IEmergencyContact): Promise<ITenant | null>;
  addDocument(tenantId: string | Types.ObjectId, documentUrl: string): Promise<ITenant | null>;
  removeDocument(tenantId: string | Types.ObjectId, documentUrl: string): Promise<ITenant | null>;
  getStatsByOwner(ownerId: string | Types.ObjectId): Promise<{
    total: number;
    active: number;
    pending: number;
    terminated: number;
    byProperty: { propertyId: Types.ObjectId; count: number }[];
    expiringLeases: number;
  }>;
  isUserTenantInProperty(userId: string | Types.ObjectId, propertyId: string | Types.ObjectId, excludeTenantId?: string | Types.ObjectId): Promise<boolean>;
  findByIdAndOwner(tenantId: string | Types.ObjectId, ownerId: string | Types.ObjectId): Promise<ITenant | null>;
}

// ==================== Payment Repository Interface ====================

export interface PaymentFilterOptions {
  ownerId?: string | Types.ObjectId;
  tenantId?: string | Types.ObjectId;
  propertyId?: string | Types.ObjectId;
  unitId?: string | Types.ObjectId;
  status?: PaymentStatus;
  type?: PaymentType;
  paymentMethod?: PaymentMethodType;
  month?: number;
  year?: number;
  bankTransferApprovalStatus?: BankTransferApprovalStatus;
}

export interface IPaymentRepository extends IRepository<IPayment> {
  findWithFilters(filter: PaymentFilterOptions, pagination: PaginationOptions): Promise<PaginatedResult<IPayment>>;
  findByTransactionRef(txRef: string): Promise<IPayment | null>;
  findByGatewayReference(reference: string): Promise<IPayment | null>;
  findByTenant(tenantId: string | Types.ObjectId, options?: Omit<PaymentFilterOptions, 'tenantId'>): Promise<IPayment[]>;
  findByOwner(ownerId: string | Types.ObjectId, options?: Omit<PaymentFilterOptions, 'ownerId'>): Promise<IPayment[]>;
  findByProperty(propertyId: string | Types.ObjectId, options?: Omit<PaymentFilterOptions, 'propertyId'>): Promise<IPayment[]>;
  findPending(ownerId?: string | Types.ObjectId): Promise<IPayment[]>;
  findOverdue(ownerId?: string | Types.ObjectId): Promise<IPayment[]>;
  findUpcoming(daysAhead: number, ownerId?: string | Types.ObjectId): Promise<IPayment[]>;
  findPendingBankTransferApproval(ownerId: string | Types.ObjectId, pagination?: PaginationOptions): Promise<PaginatedResult<IPayment>>;
  updateStatus(paymentId: string | Types.ObjectId, status: PaymentStatus): Promise<IPayment | null>;
  markAsCompleted(paymentId: string | Types.ObjectId, gatewayReference?: string, receiptNumber?: string): Promise<IPayment | null>;
  markAsFailed(paymentId: string | Types.ObjectId): Promise<IPayment | null>;
  approveBankTransfer(paymentId: string | Types.ObjectId, approverId: string | Types.ObjectId, receiptNumber: string, notes?: string): Promise<IPayment | null>;
  rejectBankTransfer(paymentId: string | Types.ObjectId, approverId: string | Types.ObjectId, notes?: string): Promise<IPayment | null>;
  findByTenantMonthYear(tenantId: string | Types.ObjectId, type: PaymentType, month: number, year: number): Promise<IPayment | null>;
  getStatsByOwner(ownerId: string | Types.ObjectId, year: number): Promise<{
    monthlyStats: { month: number; status: PaymentStatus; total: number; count: number }[];
    summary: { status: PaymentStatus; total: number; count: number }[];
  }>;
  getCalendarData(filter: PaymentFilterOptions, year: number, month: number): Promise<IPayment[]>;
  generateReceiptNumber(): string;
  getTotalRevenue(ownerId: string | Types.ObjectId, year?: number): Promise<number>;
}

// ==================== Maintenance Repository Interface ====================

export interface MaintenanceFilterOptions {
  ownerId?: string | Types.ObjectId;
  tenantId?: string | Types.ObjectId;
  propertyId?: string | Types.ObjectId;
  unitId?: string | Types.ObjectId;
  assignedTo?: string | Types.ObjectId;
  status?: MaintenanceStatus;
  category?: MaintenanceCategory;
  priority?: MaintenancePriority;
}

export interface IMaintenanceRepository extends IRepository<IMaintenance> {
  findWithFilters(filter: MaintenanceFilterOptions, pagination: PaginationOptions): Promise<PaginatedResult<IMaintenance>>;
  findByIdWithDetails(requestId: string | Types.ObjectId): Promise<IMaintenance | null>;
  findByOwner(ownerId: string | Types.ObjectId, options?: Omit<MaintenanceFilterOptions, 'ownerId'>): Promise<IMaintenance[]>;
  findByTenant(tenantId: string | Types.ObjectId, options?: Omit<MaintenanceFilterOptions, 'tenantId'>): Promise<IMaintenance[]>;
  findByTechnician(technicianId: string | Types.ObjectId, status?: MaintenanceStatus): Promise<IMaintenance[]>;
  findByProperty(propertyId: string | Types.ObjectId, options?: Omit<MaintenanceFilterOptions, 'propertyId'>): Promise<IMaintenance[]>;
  findActive(ownerId?: string | Types.ObjectId): Promise<IMaintenance[]>;
  findEmergency(ownerId?: string | Types.ObjectId): Promise<IMaintenance[]>;
  findUnassigned(ownerId?: string | Types.ObjectId): Promise<IMaintenance[]>;
  updateStatus(requestId: string | Types.ObjectId, status: MaintenanceStatus, updatedBy: string | Types.ObjectId, note?: string): Promise<IMaintenance | null>;
  assignTechnician(requestId: string | Types.ObjectId, technicianId: string | Types.ObjectId, assignedBy: string | Types.ObjectId, options?: { scheduledDate?: Date; estimatedCost?: number; note?: string }): Promise<IMaintenance | null>;
  complete(requestId: string | Types.ObjectId, completedBy: string | Types.ObjectId, options?: { actualCost?: number; completionImages?: string[]; note?: string }): Promise<IMaintenance | null>;
  submitFeedback(requestId: string | Types.ObjectId, tenantId: string | Types.ObjectId, rating: number, feedback?: string): Promise<IMaintenance | null>;
  addImages(requestId: string | Types.ObjectId, imageUrls: string[]): Promise<IMaintenance | null>;
  addCompletionImages(requestId: string | Types.ObjectId, imageUrls: string[]): Promise<IMaintenance | null>;
  findByIdAndOwner(requestId: string | Types.ObjectId, ownerId: string | Types.ObjectId): Promise<IMaintenance | null>;
  getStatsByOwner(ownerId: string | Types.ObjectId): Promise<{
    byStatus: { status: MaintenanceStatus; count: number }[];
    byPriority: { priority: MaintenancePriority; count: number }[];
    byCategory: { category: MaintenanceCategory; count: number; totalCost: number }[];
    averageResolutionTime: number;
    averageRating: number;
  }>;
}

// ==================== Waiting List Repository Interface ====================

export interface WaitingListFilterOptions {
  propertyId?: string | Types.ObjectId;
  unitId?: string | Types.ObjectId;
  applicantId?: string | Types.ObjectId;
  status?: WaitingListStatus;
  type?: 'queue' | 'application';
}

export interface IWaitingListRepository extends IRepository<IWaitingList> {
  findWithFilters(filter: WaitingListFilterOptions, pagination: PaginationOptions): Promise<PaginatedResult<IWaitingList>>;
  findByProperty(propertyId: string | Types.ObjectId, options?: Omit<WaitingListFilterOptions, 'propertyId'>): Promise<IWaitingList[]>;
  findByOwnerProperties(propertyIds: (string | Types.ObjectId)[], options?: WaitingListFilterOptions): Promise<IWaitingList[]>;
  findByApplicant(applicantId: string | Types.ObjectId, status?: WaitingListStatus): Promise<IWaitingList[]>;
  findActiveByApplicantAndProperty(applicantId: string | Types.ObjectId, propertyId: string | Types.ObjectId): Promise<IWaitingList | null>;
  findByIdAndProperty(entryId: string | Types.ObjectId, propertyId: string | Types.ObjectId): Promise<IWaitingList | null>;
  findByIdAndApplicant(entryId: string | Types.ObjectId, applicantId: string | Types.ObjectId): Promise<IWaitingList | null>;
  getNextQueuePosition(propertyId: string | Types.ObjectId, unitId?: string | Types.ObjectId): Promise<number>;
  updateStatus(entryId: string | Types.ObjectId, status: WaitingListStatus): Promise<IWaitingList | null>;
  offerUnit(entryId: string | Types.ObjectId, unitId: string | Types.ObjectId, expiresInDays?: number): Promise<IWaitingList | null>;
  acceptOffer(entryId: string | Types.ObjectId, applicantId: string | Types.ObjectId): Promise<IWaitingList | null>;
  rejectOffer(entryId: string | Types.ObjectId, applicantId: string | Types.ObjectId): Promise<IWaitingList | null>;
  expireOffers(): Promise<number>;
  updateApplication(entryId: string | Types.ObjectId, application: Partial<IApplication>): Promise<IWaitingList | null>;
  reorderQueue(propertyId: string | Types.ObjectId, removedPosition: number, unitId?: string | Types.ObjectId): Promise<number>;
  isApplicantOnWaitingList(applicantId: string | Types.ObjectId, propertyId: string | Types.ObjectId, unitId?: string | Types.ObjectId): Promise<boolean>;
  getStatsByProperty(propertyId: string | Types.ObjectId): Promise<{
    total: number;
    byStatus: { status: WaitingListStatus; count: number }[];
    byType: { type: string; count: number }[];
    averageWaitTime: number;
  }>;
  getQueue(propertyId: string | Types.ObjectId, unitId?: string | Types.ObjectId): Promise<IWaitingList[]>;
}
