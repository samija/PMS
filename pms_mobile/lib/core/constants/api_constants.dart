class ApiConstants {
  ApiConstants._();

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String profile = '/auth/profile';
  static const String googleAuth = '/auth/google';

  // Tenants
  static const String tenants = '/tenants';
  static const String myTenancy = '/tenants/my/tenancy';
  static String tenant(String id) => '/tenants/$id';
  static String terminateTenant(String id) => '/tenants/$id/terminate';
  static String tenantDocuments(String id) => '/tenants/$id/documents';

  // Properties
  static const String properties = '/properties';
  static String property(String id) => '/properties/$id';
  static String propertyUnits(String id) => '/properties/$id/units';
  static String toggleListing(String id) => '/properties/$id/toggle-listing';

  // Payments
  static const String payments = '/payments';
  static const String initializePayment = '/payments/initialize';
  static const String paymentGateways = '/payments/gateways';
  static const String bankTransfer = '/payments/bank-transfer';
  static const String pendingApproval = '/payments/pending-approval';
  static const String paymentStats = '/payments/stats/summary';
  static const String paymentCalendar = '/payments/calendar';
  static const String paymentReminders = '/payments/reminders';
  static String payment(String id) => '/payments/$id';
  static String verifyPayment(String txRef) => '/payments/verify/$txRef';
  static String approvePayment(String id) => '/payments/$id/approve';
  static String rejectPayment(String id) => '/payments/$id/reject';

  // Maintenance
  static const String maintenance = '/maintenance';
  static const String maintenanceStats = '/maintenance/stats/summary';
  static String maintenanceRequest(String id) => '/maintenance/$id';
  static String maintenanceStatus(String id) => '/maintenance/$id/status';
  static String maintenanceAssign(String id) => '/maintenance/$id/assign';
  static String maintenanceComplete(String id) => '/maintenance/$id/complete';
  static String maintenanceFeedback(String id) => '/maintenance/$id/feedback';

  // Notifications
  static const String notifications = '/notifications';
  static const String unreadCount = '/notifications/unread-count';
  static const String markAllRead = '/notifications/mark-all-read';
  static String notification(String id) => '/notifications/$id';
  static String markRead(String id) => '/notifications/$id/read';

  // Settings
  static const String paymentSettings = '/settings/payment';
  static const String supportedBanks = '/settings/supported-banks';
  static String ownerPaymentInfo(String ownerId) => '/settings/payment/$ownerId';

  // Listings
  static const String listings = '/listings';
  static String listing(String id) => '/listings/$id';
  static const String waitlistApply = '/waitlist/apply';
  static const String myApplications = '/waitlist/my-applications';
  static String cancelApplication(String id) => '/waitlist/$id/cancel';

  // Schedules
  static const String schedules = '/schedules';
  static const String mySchedules = '/schedules/my-schedule';
  static String schedule(String id) => '/schedules/$id';
  static String tenantSchedules(String tenantId) => '/schedules/tenant/$tenantId';
  static String generatePayments(String id) => '/schedules/$id/generate';
}
