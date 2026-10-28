/**
 * Dependency Injection Types
 *
 * This file contains Symbol constants used as binding identifiers for InversifyJS.
 * Using Symbols ensures type-safe dependency injection and prevents naming conflicts.
 */

export const TYPES = {
  // ==================== Repositories ====================
  UserRepository: Symbol.for('UserRepository'),
  PropertyRepository: Symbol.for('PropertyRepository'),
  UnitRepository: Symbol.for('UnitRepository'),
  TenantRepository: Symbol.for('TenantRepository'),
  PaymentRepository: Symbol.for('PaymentRepository'),
  MaintenanceRepository: Symbol.for('MaintenanceRepository'),
  WaitingListRepository: Symbol.for('WaitingListRepository'),
  EmployeeRepository: Symbol.for('EmployeeRepository'),
  GuardShiftRepository: Symbol.for('GuardShiftRepository'),
  AttendanceRepository: Symbol.for('AttendanceRepository'),
  IncidentRepository: Symbol.for('IncidentRepository'),
  LeaveRequestRepository: Symbol.for('LeaveRequestRepository'),
  PerformanceReviewRepository: Symbol.for('PerformanceReviewRepository'),
  PayrollRepository: Symbol.for('PayrollRepository'),

  // ==================== Services ====================
  AuthService: Symbol.for('AuthService'),
  PropertyService: Symbol.for('PropertyService'),
  TenantService: Symbol.for('TenantService'),
  PaymentService: Symbol.for('PaymentService'),
  MaintenanceService: Symbol.for('MaintenanceService'),
  WaitingListService: Symbol.for('WaitingListService'),
  OwnerSettingsService: Symbol.for('OwnerSettingsService'),
  EmailReminderService: Symbol.for('EmailReminderService'),
  PaymentScheduleService: Symbol.for('PaymentScheduleService'),
  NotificationService: Symbol.for('NotificationService'),
  EmployeeService: Symbol.for('EmployeeService'),
  GuardService: Symbol.for('GuardService'),
  AttendanceService: Symbol.for('AttendanceService'),
  IncidentService: Symbol.for('IncidentService'),
  LeaveService: Symbol.for('LeaveService'),
  PayrollService: Symbol.for('PayrollService'),
  PerformanceService: Symbol.for('PerformanceService'),
  StaffService: Symbol.for('StaffService'),
  ListingService: Symbol.for('ListingService'),

  // ==================== Controllers ====================
  AuthController: Symbol.for('AuthController'),
  PropertyController: Symbol.for('PropertyController'),
  TenantController: Symbol.for('TenantController'),
  PaymentController: Symbol.for('PaymentController'),
  MaintenanceController: Symbol.for('MaintenanceController'),
  WaitingListController: Symbol.for('WaitingListController'),
  SettingsController: Symbol.for('SettingsController'),
  ListingController: Symbol.for('ListingController'),
  StaffController: Symbol.for('StaffController'),
  EmployeeController: Symbol.for('EmployeeController'),
  GuardController: Symbol.for('GuardController'),
  AttendanceController: Symbol.for('AttendanceController'),
  IncidentController: Symbol.for('IncidentController'),
  LeaveController: Symbol.for('LeaveController'),
  PayrollController: Symbol.for('PayrollController'),
  PerformanceController: Symbol.for('PerformanceController'),

  // ==================== Models (Mongoose) ====================
  UserModel: Symbol.for('UserModel'),
  PropertyModel: Symbol.for('PropertyModel'),
  UnitModel: Symbol.for('UnitModel'),
  TenantModel: Symbol.for('TenantModel'),
  PaymentModel: Symbol.for('PaymentModel'),
  MaintenanceModel: Symbol.for('MaintenanceModel'),
  WaitingListModel: Symbol.for('WaitingListModel'),
  PropertyStaffModel: Symbol.for('PropertyStaffModel'),
  OwnerPaymentSettingsModel: Symbol.for('OwnerPaymentSettingsModel'),
  PaymentScheduleModel: Symbol.for('PaymentScheduleModel'),
  NotificationModel: Symbol.for('NotificationModel'),
  EmployeeModel: Symbol.for('EmployeeModel'),
  GuardShiftModel: Symbol.for('GuardShiftModel'),
  AttendanceModel: Symbol.for('AttendanceModel'),
  IncidentModel: Symbol.for('IncidentModel'),
  LeaveRequestModel: Symbol.for('LeaveRequestModel'),
  PerformanceReviewModel: Symbol.for('PerformanceReviewModel'),
  PayrollModel: Symbol.for('PayrollModel'),

  // ==================== Identity & Document Management ====================
  TenantIdentityService: Symbol.for('TenantIdentityService'),
  FieldEncryption: Symbol.for('FieldEncryption'),
  TenantDocumentModel: Symbol.for('TenantDocumentModel'),
  TenantDocumentRepository: Symbol.for('TenantDocumentRepository'),
  TenantDocumentService: Symbol.for('TenantDocumentService'),
  CloudinaryObjectStorage: Symbol.for('CloudinaryObjectStorage'),
  LeaseTemplateModel: Symbol.for('LeaseTemplateModel'),
  LeaseTemplateRepository: Symbol.for('LeaseTemplateRepository'),
  LeaseTemplateService: Symbol.for('LeaseTemplateService'),
  PdfRenderer: Symbol.for('PdfRenderer'),
  LeaseAgreementModel: Symbol.for('LeaseAgreementModel'),
  LeaseAgreementRepository: Symbol.for('LeaseAgreementRepository'),
  LeaseAgreementService: Symbol.for('LeaseAgreementService'),
  SignatureProvider: Symbol.for('SignatureProvider'),
  TenantAuditLogModel: Symbol.for('TenantAuditLogModel'),
  TenantAuditLogRepository: Symbol.for('TenantAuditLogRepository'),
  TenantAuditService: Symbol.for('TenantAuditService'),

  // ==================== Infrastructure ====================
  PaymentGatewayFactory: Symbol.for('PaymentGatewayFactory'),
};

export default TYPES;
