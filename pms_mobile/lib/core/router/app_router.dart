import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_provider.dart';
import '../../features/auth/application/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/listings/presentation/apply_screen.dart';
import '../../features/listings/presentation/listing_detail_screen.dart';
import '../../features/listings/presentation/listing_list_screen.dart';
import '../../features/listings/presentation/my_applications_screen.dart';
import '../../features/maintenance/presentation/create_request_screen.dart';
import '../../features/maintenance/presentation/maintenance_detail_screen.dart';
import '../../features/maintenance/presentation/maintenance_list_screen.dart';
import '../../features/maintenance/presentation/submit_feedback_screen.dart';
import '../../features/notifications/presentation/notification_list_screen.dart';
import '../../features/onboarding/application/onboarding_provider.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/owner_dashboard/presentation/owner_dashboard_screen.dart';
import '../../features/payments/domain/payment.dart';
import '../../features/payments/presentation/approval_detail_screen.dart';
import '../../features/payments/presentation/bank_transfer_screen.dart';
import '../../features/payments/presentation/pay_rent_screen.dart';
import '../../features/payments/presentation/payment_detail_screen.dart';
import '../../features/payments/presentation/payment_list_screen.dart';
import '../../features/payments/presentation/payment_result_screen.dart';
import '../../features/payments/presentation/payment_webview_screen.dart';
import '../../features/payments/presentation/pending_approvals_screen.dart';
import '../../features/properties/presentation/add_property_screen.dart';
import '../../features/properties/presentation/add_unit_screen.dart';
import '../../features/properties/presentation/edit_property_screen.dart';
import '../../features/properties/presentation/property_detail_screen.dart';
import '../../features/properties/presentation/property_list_screen.dart';
import '../../features/schedules/presentation/payment_calendar_screen.dart';
import '../../features/schedules/presentation/schedule_list_screen.dart';
import '../../features/settings/presentation/edit_profile_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/tenant_dashboard/presentation/lease_detail_screen.dart';
import '../../features/tenant_dashboard/presentation/tenant_dashboard_screen.dart';
import '../../features/tenants/presentation/add_tenant_screen.dart';
import '../../features/tenants/presentation/tenant_detail_screen.dart';
import '../../features/tenants/presentation/tenant_list_screen.dart';
import '../theme/app_theme.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final onboardingComplete = ref.watch(onboardingCompleteProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoading = authState is AuthInitial || authState is AuthLoading;
      final loc = state.matchedLocation;
      final isAuthRoute =
          loc == '/login' || loc == '/register' || loc == '/guest-login';
      final isSplash = loc == '/';
      final isOnboarding = loc == '/onboarding';
      final isGuestRoute = loc == '/guest' ||
          loc == '/guest-login' ||
          loc.startsWith('/listings');

      // Still loading — stay on splash
      if (isLoading && isSplash) return null;
      if (isLoading) return '/';

      // Authenticated user
      if (authState is AuthAuthenticated) {
        if (isAuthRoute || isSplash || isOnboarding || isGuestRoute) {
          return authState.user.role == 'owner'
              ? '/owner-dashboard'
              : '/dashboard';
        }
        return null;
      }

      // Unauthenticated user
      if (!onboardingComplete && !isOnboarding) {
        return '/onboarding';
      }
      if (onboardingComplete && (isSplash || isOnboarding)) {
        return '/guest';
      }
      if (isGuestRoute || isAuthRoute) {
        return null;
      }
      return '/guest';
    },
    routes: [
      // ── Auth / Onboarding (no bottom nav) ─────────────────────────
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
          path: '/onboarding', builder: (_, __) => const OnboardingScreen()),

      // ── Guest Shell (2 tabs: Listings + Login) ────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => _BottomNavShell(
          navigationShell: navigationShell,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.search_outlined),
              selectedIcon: Icon(Icons.search_rounded),
              label: 'Listings',
            ),
            NavigationDestination(
              icon: Icon(Icons.login_outlined),
              selectedIcon: Icon(Icons.login_rounded),
              label: 'Login',
            ),
          ],
        ),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/guest',
                builder: (_, __) => const ListingListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/guest-login',
                builder: (_, __) => const LoginScreen()),
          ]),
        ],
      ),

      // ── Tenant Shell ───────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => _BottomNavShell(
          navigationShell: navigationShell,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.search_outlined), selectedIcon: Icon(Icons.search_rounded), label: 'Listings'),
            NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long_rounded), label: 'Payments'),
            NavigationDestination(icon: Icon(Icons.build_circle_outlined), selectedIcon: Icon(Icons.build_circle), label: 'Maintenance'),
            NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings_rounded), label: 'Settings'),
          ],
        ),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/dashboard', builder: (_, __) => const TenantDashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/listings', builder: (_, __) => const ListingListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/payments', builder: (_, __) => const PaymentListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/maintenance', builder: (_, __) => const MaintenanceListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
          ]),
        ],
      ),

      // ── Owner Shell ────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => _BottomNavShell(
          navigationShell: navigationShell,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard_rounded), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.apartment_outlined), selectedIcon: Icon(Icons.apartment_rounded), label: 'Properties'),
            NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people_rounded), label: 'Tenants'),
            NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long_rounded), label: 'Payments'),
            NavigationDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings_rounded), label: 'Settings'),
          ],
        ),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/owner-dashboard', builder: (_, __) => const OwnerDashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/properties', builder: (_, __) => const PropertyListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/tenants', builder: (_, __) => const TenantListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/owner-payments', builder: (_, __) => const PaymentListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/owner-settings', builder: (_, __) => const SettingsScreen()),
          ]),
        ],
      ),

      // ── Sub-pages (pushed on top of shell, keeping bottom nav visible context) ──

      // Tenant sub-pages
      GoRoute(path: '/lease', builder: (_, __) => const LeaseDetailScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationListScreen()),
      GoRoute(path: '/schedules', builder: (_, __) => const ScheduleListScreen()),
      GoRoute(path: '/schedules/calendar', builder: (_, __) => const PaymentCalendarScreen()),
      GoRoute(path: '/my-applications', builder: (_, __) => const MyApplicationsScreen()),

      // Listings sub-pages
      GoRoute(
        path: '/listings/:id',
        builder: (_, state) => ListingDetailScreen(listingId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/listings/:id/apply',
        builder: (_, state) => ApplyScreen(listingId: state.pathParameters['id']!),
      ),

      // Payment sub-pages
      GoRoute(path: '/payments/pay', builder: (_, __) => const PayRentScreen()),
      GoRoute(
        path: '/payments/webview',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>;
          return PaymentWebViewScreen(
            checkoutUrl: extra['checkoutUrl'] as String,
            txRef: extra['txRef'] as String,
          );
        },
      ),
      GoRoute(
        path: '/payments/result',
        builder: (_, state) => PaymentResultScreen(payment: state.extra as Payment?),
      ),
      GoRoute(
        path: '/payments/bank-transfer',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>;
          return BankTransferScreen(
            tenantId: extra['tenantId'] as String,
            amount: extra['amount'] as num,
            month: extra['month'] as int,
            year: extra['year'] as int,
          );
        },
      ),
      GoRoute(path: '/payments/pending', builder: (_, __) => const PendingApprovalsScreen()),
      GoRoute(
        path: '/payments/approval/:id',
        builder: (_, state) => ApprovalDetailScreen(paymentId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/payments/:id',
        builder: (_, state) => PaymentDetailScreen(paymentId: state.pathParameters['id']!),
      ),

      // Maintenance sub-pages
      GoRoute(path: '/maintenance/create', builder: (_, __) => const CreateRequestScreen()),
      GoRoute(
        path: '/maintenance/:id',
        builder: (_, state) => MaintenanceDetailScreen(requestId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/maintenance/:id/feedback',
        builder: (_, state) => SubmitFeedbackScreen(requestId: state.pathParameters['id']!),
      ),

      // Property sub-pages
      GoRoute(path: '/properties/add', builder: (_, __) => const AddPropertyScreen()),
      GoRoute(
        path: '/properties/:id',
        builder: (_, state) => PropertyDetailScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/properties/:id/edit',
        builder: (_, state) => EditPropertyScreen(propertyId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/properties/:id/add-unit',
        builder: (_, state) => AddUnitScreen(propertyId: state.pathParameters['id']!),
      ),

      // Tenant sub-pages
      GoRoute(path: '/tenants/add', builder: (_, __) => const AddTenantScreen()),
      GoRoute(
        path: '/tenants/:id',
        builder: (_, state) => TenantDetailScreen(tenantId: state.pathParameters['id']!),
      ),

      // Settings sub-pages
      GoRoute(path: '/settings/profile', builder: (_, __) => const EditProfileScreen()),
    ],
  );
});

// ── Shared Bottom Nav Widget ─────────────────────────────────────────────────

class _BottomNavShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  final List<NavigationDestination> destinations;

  const _BottomNavShell({
    required this.navigationShell,
    required this.destinations,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.gray200, width: 0.5)),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          indicatorColor: AppTheme.primaryLight,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          height: 65,
          destinations: destinations,
        ),
      ),
    );
  }
}
