import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/shimmer_widgets.dart';
import '../../auth/application/auth_provider.dart';
import '../../auth/application/auth_state.dart';
import '../application/tenant_dashboard_provider.dart';
import '../domain/tenancy.dart';

class TenantDashboardScreen extends ConsumerWidget {
  const TenantDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final tenancyAsync = ref.watch(tenancyProvider);
    final userName = authState is AuthAuthenticated ? authState.user.name : 'Tenant';

    return Scaffold(
      backgroundColor: AppTheme.gray50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Good ${_greeting()}',
              style: TextStyle(fontSize: 13, color: AppTheme.gray500, fontWeight: FontWeight.w400),
            ),
            Text(
              userName,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.gray900),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Stack(
              children: [
                Icon(Icons.notifications_outlined, color: AppTheme.gray600),
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: AppTheme.errorRed,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () => context.push('/notifications'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.primaryBlue,
        onRefresh: () => ref.read(tenancyProvider.notifier).refresh(),
        child: tenancyAsync.when(
          loading: () => const ShimmerDashboard(),
          error: (error, _) => AppErrorWidget(
            message: error.toString(),
            onRetry: () => ref.read(tenancyProvider.notifier).refresh(),
          ),
          data: (tenancy) {
            if (tenancy == null) return _buildNoTenancy(context);
            return _buildDashboard(context, ref, tenancy);
          },
        ),
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  Widget _buildNoTenancy(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.home_outlined, size: 48, color: AppTheme.primaryBlue),
            ),
            const SizedBox(height: 24),
            Text(
              'No Active Tenancy',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppTheme.gray900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You don\'t have an active rental agreement yet.\nBrowse available listings to find your next home.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppTheme.gray500, height: 1.5),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.push('/listings'),
              icon: const Icon(Icons.search_rounded),
              label: const Text('Browse Listings'),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primaryBlue,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => context.push('/my-applications'),
              child: Text(
                'View My Applications',
                style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboard(BuildContext context, WidgetRef ref, Tenancy tenancy) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Rent Summary Card
        _RentCard(tenancy: tenancy),
        const SizedBox(height: 16),

        // Lease Status
        _LeaseCard(tenancy: tenancy),
        const SizedBox(height: 24),

        // Quick Actions
        Text(
          'Quick Actions',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.gray900),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionTile(
                icon: Icons.payment_rounded,
                label: 'Pay Rent',
                color: AppTheme.primaryBlue,
                onTap: () => context.go('/payments/pay'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionTile(
                icon: Icons.build_circle_outlined,
                label: 'Maintenance',
                color: AppTheme.warning,
                onTap: () => context.go('/maintenance/create'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionTile(
                icon: Icons.receipt_long_rounded,
                label: 'Payments',
                color: AppTheme.success,
                onTap: () => context.go('/payments'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionTile(
                icon: Icons.description_outlined,
                label: 'My Lease',
                color: AppTheme.purple,
                onTap: () => context.go('/lease'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _ActionTile(
                icon: Icons.search_rounded,
                label: 'Listings',
                color: AppTheme.info,
                onTap: () => context.push('/listings'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ActionTile(
                icon: Icons.calendar_month_rounded,
                label: 'Schedule',
                color: AppTheme.gray600,
                onTap: () => context.push('/schedules'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Property Info
        _PropertyCard(tenancy: tenancy),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _RentCard extends StatelessWidget {
  final Tenancy tenancy;
  const _RentCard({required this.tenancy});

  @override
  Widget build(BuildContext context) {
    final rent = tenancy.leaseAgreement?.monthlyRent ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), AppTheme.primaryBlue, AppTheme.primaryDark],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryBlue.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                'Rent Due This Month',
                style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.85)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            EtbFormatter.format(rent),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.calendar_today_rounded, color: Colors.white, size: 14),
                const SizedBox(width: 6),
                Text(
                  'Unit ${tenancy.unitId?.unitNumber ?? '-'} · Due monthly',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LeaseCard extends StatelessWidget {
  final Tenancy tenancy;
  const _LeaseCard({required this.tenancy});

  @override
  Widget build(BuildContext context) {
    final lease = tenancy.leaseAgreement;
    final daysLeft = tenancy.daysUntilLeaseEnd;
    final isExpiring = tenancy.isLeaseExpiringSoon;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.gray200, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.description_outlined, size: 20, color: AppTheme.gray600),
              const SizedBox(width: 8),
              Text(
                'Lease Status',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.gray900),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: tenancy.isActive ? AppTheme.successLight : AppTheme.errorLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  tenancy.status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: tenancy.isActive ? AppTheme.success : AppTheme.errorRed,
                  ),
                ),
              ),
            ],
          ),
          Divider(height: 24, color: AppTheme.gray200),
          _Row('Start Date', lease?.startDate != null ? DateHelper.formatDate(lease!.startDate!) : '-'),
          const SizedBox(height: 10),
          _Row('End Date', lease?.endDate != null ? DateHelper.formatDate(lease!.endDate!) : '-'),
          const SizedBox(height: 10),
          _Row(
            'Days Remaining',
            '$daysLeft days',
            valueColor: isExpiring ? AppTheme.errorRed : AppTheme.success,
          ),
          if (isExpiring) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.warningLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: AppTheme.warning, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Your lease is expiring soon. Contact your landlord.',
                      style: TextStyle(fontSize: 13, color: AppTheme.gray700),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _Row(this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 14, color: AppTheme.gray500)),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? AppTheme.gray900,
          ),
        ),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.gray200, width: 0.5),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.gray700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PropertyCard extends StatelessWidget {
  final Tenancy tenancy;
  const _PropertyCard({required this.tenancy});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.gray200, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.apartment_rounded, size: 20, color: AppTheme.gray600),
              const SizedBox(width: 8),
              Text(
                'Property Details',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.gray900),
              ),
            ],
          ),
          Divider(height: 24, color: AppTheme.gray200),
          _Row('Property', tenancy.propertyId?.name ?? '-'),
          const SizedBox(height: 10),
          _Row('Unit', tenancy.unitId?.unitNumber ?? '-'),
          const SizedBox(height: 10),
          _Row('Type', tenancy.unitId?.type ?? '-'),
          const SizedBox(height: 10),
          _Row('Floor', '${tenancy.unitId?.floor ?? '-'}'),
          if (tenancy.unitId?.size != null) ...[
            const SizedBox(height: 10),
            _Row('Size', '${tenancy.unitId!.size} sqm'),
          ],
          if (tenancy.propertyId?.address != null) ...[
            const SizedBox(height: 10),
            _Row('Address', tenancy.propertyId!.address!.formatted),
          ],
        ],
      ),
    );
  }
}
