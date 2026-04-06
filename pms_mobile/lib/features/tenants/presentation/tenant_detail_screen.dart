import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../application/tenant_provider.dart';
import '../domain/tenant.dart';

class TenantDetailScreen extends ConsumerWidget {
  final String tenantId;
  const TenantDetailScreen({super.key, required this.tenantId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tenantAsync = ref.watch(tenantDetailProvider(tenantId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tenant Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/tenants/$tenantId/edit'),
          ),
        ],
      ),
      body: tenantAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(tenantDetailProvider(tenantId)),
        ),
        data: (tenant) {
          if (tenant == null) {
            return const Center(child: Text('Tenant not found'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildHeaderCard(context, tenant),
                const SizedBox(height: 16),
                _buildLeaseInfoCard(context, tenant),
                const SizedBox(height: 16),
                _buildPropertyInfoCard(context, tenant),
                const SizedBox(height: 24),
                _buildActionButtons(context, ref, tenant),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeaderCard(BuildContext context, Tenant tenant) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
              child: Text(
                tenant.initials,
                style: const TextStyle(
                  color: AppTheme.primaryBlue,
                  fontWeight: FontWeight.w700,
                  fontSize: 24,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              tenant.name,
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            _buildStatusBadge(tenant),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _buildContactRow(context, Icons.email_outlined, tenant.email),
            if (tenant.phone != null && tenant.phone!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildContactRow(context, Icons.phone_outlined, tenant.phone!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildContactRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.gray500),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppTheme.gray700),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(Tenant tenant) {
    Color bgColor;
    Color textColor;

    switch (tenant.status) {
      case 'active':
        bgColor = AppTheme.successLight;
        textColor = AppTheme.success;
        break;
      case 'expired':
        bgColor = AppTheme.warningLight;
        textColor = AppTheme.warning;
        break;
      case 'terminated':
        bgColor = AppTheme.errorLight;
        textColor = AppTheme.errorRed;
        break;
      default:
        bgColor = AppTheme.gray100;
        textColor = AppTheme.gray600;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        tenant.status[0].toUpperCase() + tenant.status.substring(1),
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildLeaseInfoCard(BuildContext context, Tenant tenant) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Lease Information',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              'Monthly Rent',
              EtbFormatter.format(tenant.monthlyRent),
            ),
            const Divider(height: 20),
            _buildInfoRow(
              context,
              'Lease Start',
              tenant.leaseStart != null
                  ? dateFormat.format(tenant.leaseStart!)
                  : 'N/A',
            ),
            const Divider(height: 20),
            _buildInfoRow(
              context,
              'Lease End',
              tenant.leaseEnd != null
                  ? dateFormat.format(tenant.leaseEnd!)
                  : 'N/A',
            ),
            if (tenant.leaseEnd != null) ...[
              const Divider(height: 20),
              _buildInfoRow(
                context,
                'Remaining',
                _remainingDays(tenant.leaseEnd!),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPropertyInfoCard(BuildContext context, Tenant tenant) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Property Information',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            _buildInfoRow(context, 'Property', tenant.displayProperty),
            const Divider(height: 20),
            _buildInfoRow(context, 'Unit', tenant.displayUnit),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: AppTheme.gray500),
        ),
        Text(
          value,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  String _remainingDays(DateTime leaseEnd) {
    final diff = leaseEnd.difference(DateTime.now());
    if (diff.isNegative) return 'Expired';
    if (diff.inDays > 30) {
      final months = (diff.inDays / 30).floor();
      return '$months month${months > 1 ? 's' : ''} left';
    }
    return '${diff.inDays} day${diff.inDays != 1 ? 's' : ''} left';
  }

  Widget _buildActionButtons(
      BuildContext context, WidgetRef ref, Tenant tenant) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        OutlinedButton.icon(
          onPressed: () => context.push('/tenants/${tenant.id}/edit'),
          icon: const Icon(Icons.edit_outlined),
          label: const Text('Edit Tenant'),
        ),
        if (tenant.isActive) ...[
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: () => _showTerminateDialog(context, ref, tenant),
            icon: const Icon(Icons.block),
            label: const Text('Terminate Lease'),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.errorRed,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ],
    );
  }

  void _showTerminateDialog(
      BuildContext context, WidgetRef ref, Tenant tenant) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Terminate Lease'),
        content: Text(
            'Are you sure you want to terminate the lease for ${tenant.name}? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final repo = ref.read(tenantRepositoryProvider);
              final result = await repo.terminateTenant(tenant.id);
              result.fold(
                (f) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(f.message),
                        backgroundColor: AppTheme.errorRed,
                      ),
                    );
                  }
                },
                (_) {
                  ref.invalidate(tenantDetailProvider(tenantId));
                  ref.read(tenantListProvider.notifier).refresh();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Lease terminated successfully'),
                        backgroundColor: AppTheme.success,
                      ),
                    );
                  }
                },
              );
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.errorRed,
            ),
            child: const Text('Terminate'),
          ),
        ],
      ),
    );
  }
}
