/**
 * Domain Interfaces Exports
 *
 * This module exports all domain interfaces for the Property Management System.
 */

// Repository Interface
export {
  IRepository,
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
  PopulateOptions,
} from './IRepository.js';

// Payment Gateway Interface
export {
  IPaymentGateway,
  PaymentGatewayType,
  PaymentInitializationPayload,
  PaymentInitializationResponse,
  PaymentVerificationResponse,
  WebhookPayload,
} from './IPaymentGateway.js';

// Repository Interfaces
export {
  IUserRepository,
  IPropertyRepository,
  IUnitRepository,
  ITenantRepository,
  IPaymentRepository,
  IMaintenanceRepository,
  IWaitingListRepository,
  PropertyFilterOptions,
  UnitFilterOptions,
  TenantFilterOptions,
  PaymentFilterOptions,
  MaintenanceFilterOptions,
  WaitingListFilterOptions,
} from './IRepositories.js';

// Service Interfaces
export {
  IAuthService,
  IPropertyService,
  ITenantService,
  IPaymentService,
  IMaintenanceService,
  IWaitingListService,
  IOwnerSettingsService,
  IEmailReminderService,
  RegisterData,
  LoginData,
  UpdateProfileData,
  AuthResponse,
  UserProfile,
  CreatePropertyData,
  UpdatePropertyData,
  CreateUnitData,
  UpdateUnitData,
  PropertyQueryOptions,
  UnitQueryOptions,
  CreateTenantData,
  UpdateTenantData,
  TenantQueryOptions,
  InitializePaymentData,
  InitializePaymentResult,
  CreateManualPaymentData,
  PaymentQueryOptions,
  SubmitBankTransferData,
  CreateMaintenanceRequestData,
  UpdateMaintenanceStatusData,
  AssignTechnicianData,
  CompleteMaintenanceData,
  SubmitFeedbackData,
  MaintenanceQueryOptions,
  ApplyToWaitingListData,
  OfferUnitData,
  RespondToOfferData,
  UpdateWaitingListStatusData,
  WaitingListQueryOptions,
  UpdatePaymentSettingsData,
  PublicPaymentInfo,
} from './IServices.js';
