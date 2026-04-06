/**
 * Dependency Injection Container Configuration
 *
 * This file configures the InversifyJS container with all bindings for:
 * - Mongoose Models
 * - Repositories
 * - Services
 *
 * The container provides a centralized location for managing dependencies
 * and enables loose coupling throughout the application.
 */

import { Container } from 'inversify';
import { Model } from 'mongoose';
import TYPES from './types.js';

// Import Mongoose Models
import User from '../models/User.js';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import Tenant from '../models/Tenant.js';
import Payment from '../models/Payment.js';
import Maintenance from '../models/Maintenance.js';
import WaitingList from '../models/WaitingList.js';
import PropertyStaff from '../models/PropertyStaff.js';
import OwnerPaymentSettings from '../models/OwnerPaymentSettings.js';
import PaymentSchedule from '../models/PaymentSchedule.js';
import Notification from '../models/Notification.js';
import Employee from '../models/Employee.js';
import GuardShift from '../models/GuardShift.js';
import Attendance from '../models/Attendance.js';
import Incident from '../models/Incident.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PerformanceReview from '../models/PerformanceReview.js';
import Payroll from '../models/Payroll.js';

// Import Type Interfaces
import {
  IUser,
  IProperty,
  IUnit,
  ITenant,
  IPayment,
  IMaintenance,
  IWaitingList,
  IPropertyStaff,
  IOwnerPaymentSettings,
  IPaymentSchedule,
  INotification,
  IEmployee,
  IGuardShift,
  IAttendance,
  IIncident,
  ILeaveRequest,
  IPerformanceReview,
  IPayroll,
} from '../types/index.js';

// Import Repositories
import {
  UserRepository,
  PropertyRepository,
  UnitRepository,
  TenantRepository,
  PaymentRepository,
  MaintenanceRepository,
  WaitingListRepository,
  EmployeeRepository,
  GuardShiftRepository,
  AttendanceRepository,
  IncidentRepository,
  LeaveRequestRepository,
  PerformanceReviewRepository,
  PayrollRepository,
} from '../infrastructure/repositories/index.js';

// Import Services
import { AuthService } from '../application/services/AuthService.js';
import { PropertyService } from '../application/services/PropertyService.js';
import { TenantService } from '../application/services/TenantService.js';
import { PaymentService } from '../application/services/PaymentService.js';
import { MaintenanceService } from '../application/services/MaintenanceService.js';
import { WaitingListService } from '../application/services/WaitingListService.js';
import { OwnerSettingsService } from '../application/services/OwnerSettingsService.js';
import { EmailReminderService } from '../application/services/EmailReminderService.js';
import { PaymentScheduleService } from '../application/services/PaymentScheduleService.js';
import { NotificationService } from '../application/services/NotificationService.js';
import { EmployeeService } from '../application/services/EmployeeService.js';
import { GuardService } from '../application/services/GuardService.js';
import { AttendanceService } from '../application/services/AttendanceService.js';
import { IncidentService } from '../application/services/IncidentService.js';
import { LeaveService } from '../application/services/LeaveService.js';
import { PayrollService } from '../application/services/PayrollService.js';
import { PerformanceService } from '../application/services/PerformanceService.js';

// Import Service Interfaces
import {
  IAuthService,
  IPropertyService,
  ITenantService,
  IPaymentService,
  IMaintenanceService,
  IWaitingListService,
  IOwnerSettingsService,
  IEmailReminderService,
  IPaymentScheduleService,
  INotificationService,
  IEmployeeService,
  IGuardService,
  IAttendanceService,
  IIncidentService,
  ILeaveService,
  IPayrollService,
  IPerformanceService,
} from '../domain/interfaces/IServices.js';

// Create the container
const container = new Container();

// ==================== Bind Mongoose Models ====================
// Models are bound as constant values since they are singletons created by Mongoose

container.bind<Model<IUser>>(TYPES.UserModel).toConstantValue(User);
container.bind<Model<IProperty>>(TYPES.PropertyModel).toConstantValue(Property);
container.bind<Model<IUnit>>(TYPES.UnitModel).toConstantValue(Unit);
container.bind<Model<ITenant>>(TYPES.TenantModel).toConstantValue(Tenant);
container.bind<Model<IPayment>>(TYPES.PaymentModel).toConstantValue(Payment);
container.bind<Model<IMaintenance>>(TYPES.MaintenanceModel).toConstantValue(Maintenance);
container.bind<Model<IWaitingList>>(TYPES.WaitingListModel).toConstantValue(WaitingList);
container.bind<Model<IPropertyStaff>>(TYPES.PropertyStaffModel).toConstantValue(PropertyStaff);
container.bind<Model<IOwnerPaymentSettings>>(TYPES.OwnerPaymentSettingsModel).toConstantValue(OwnerPaymentSettings);
container.bind<Model<IPaymentSchedule>>(TYPES.PaymentScheduleModel).toConstantValue(PaymentSchedule);
container.bind<Model<INotification>>(TYPES.NotificationModel).toConstantValue(Notification);
container.bind<Model<IEmployee>>(TYPES.EmployeeModel).toConstantValue(Employee);
container.bind<Model<IGuardShift>>(TYPES.GuardShiftModel).toConstantValue(GuardShift);
container.bind<Model<IAttendance>>(TYPES.AttendanceModel).toConstantValue(Attendance);
container.bind<Model<IIncident>>(TYPES.IncidentModel).toConstantValue(Incident);
container.bind<Model<ILeaveRequest>>(TYPES.LeaveRequestModel).toConstantValue(LeaveRequest);
container.bind<Model<IPerformanceReview>>(TYPES.PerformanceReviewModel).toConstantValue(PerformanceReview);
container.bind<Model<IPayroll>>(TYPES.PayrollModel).toConstantValue(Payroll);

// ==================== Bind Repositories ====================
// Repositories are bound in singleton scope for efficiency

container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<PropertyRepository>(TYPES.PropertyRepository).to(PropertyRepository).inSingletonScope();
container.bind<UnitRepository>(TYPES.UnitRepository).to(UnitRepository).inSingletonScope();
container.bind<TenantRepository>(TYPES.TenantRepository).to(TenantRepository).inSingletonScope();
container.bind<PaymentRepository>(TYPES.PaymentRepository).to(PaymentRepository).inSingletonScope();
container.bind<MaintenanceRepository>(TYPES.MaintenanceRepository).to(MaintenanceRepository).inSingletonScope();
container.bind<WaitingListRepository>(TYPES.WaitingListRepository).to(WaitingListRepository).inSingletonScope();
container.bind<EmployeeRepository>(TYPES.EmployeeRepository).to(EmployeeRepository).inSingletonScope();
container.bind<GuardShiftRepository>(TYPES.GuardShiftRepository).to(GuardShiftRepository).inSingletonScope();
container.bind<AttendanceRepository>(TYPES.AttendanceRepository).to(AttendanceRepository).inSingletonScope();
container.bind<IncidentRepository>(TYPES.IncidentRepository).to(IncidentRepository).inSingletonScope();
container.bind<LeaveRequestRepository>(TYPES.LeaveRequestRepository).to(LeaveRequestRepository).inSingletonScope();
container.bind<PerformanceReviewRepository>(TYPES.PerformanceReviewRepository).to(PerformanceReviewRepository).inSingletonScope();
container.bind<PayrollRepository>(TYPES.PayrollRepository).to(PayrollRepository).inSingletonScope();

// ==================== Bind Services ====================
// Services are bound in singleton scope for efficiency

container.bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<IPropertyService>(TYPES.PropertyService).to(PropertyService).inSingletonScope();
container.bind<ITenantService>(TYPES.TenantService).to(TenantService).inSingletonScope();
container.bind<IPaymentService>(TYPES.PaymentService).to(PaymentService).inSingletonScope();
container.bind<IMaintenanceService>(TYPES.MaintenanceService).to(MaintenanceService).inSingletonScope();
container.bind<IWaitingListService>(TYPES.WaitingListService).to(WaitingListService).inSingletonScope();
container.bind<IOwnerSettingsService>(TYPES.OwnerSettingsService).to(OwnerSettingsService).inSingletonScope();
container.bind<IEmailReminderService>(TYPES.EmailReminderService).to(EmailReminderService).inSingletonScope();
container.bind<IPaymentScheduleService>(TYPES.PaymentScheduleService).to(PaymentScheduleService).inSingletonScope();
container.bind<INotificationService>(TYPES.NotificationService).to(NotificationService).inSingletonScope();
container.bind<IEmployeeService>(TYPES.EmployeeService).to(EmployeeService).inSingletonScope();
container.bind<IGuardService>(TYPES.GuardService).to(GuardService).inSingletonScope();
container.bind<IAttendanceService>(TYPES.AttendanceService).to(AttendanceService).inSingletonScope();
container.bind<IIncidentService>(TYPES.IncidentService).to(IncidentService).inSingletonScope();
container.bind<ILeaveService>(TYPES.LeaveService).to(LeaveService).inSingletonScope();
container.bind<IPayrollService>(TYPES.PayrollService).to(PayrollService).inSingletonScope();
container.bind<IPerformanceService>(TYPES.PerformanceService).to(PerformanceService).inSingletonScope();

export { container };
export default container;
