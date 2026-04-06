import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../application/tenant_provider.dart';
import '../domain/tenant.dart';

class TenantListScreen extends ConsumerStatefulWidget {
  const TenantListScreen({super.key});

  @override
  ConsumerState<TenantListScreen> createState() => _TenantListScreenState();
}

class _TenantListScreenState extends ConsumerState<TenantListScreen> {
  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final tenantsAsync = ref.watch(tenantListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tenants'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/tenants/add'),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterChips(),
          Expanded(
            child: tenantsAsync.when(
              loading: () => const LoadingWidget(),
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.read(tenantListProvider.notifier).refresh(),
              ),
              data: (paginated) {
                if (paginated.tenants.isEmpty) {
                  return const EmptyStateWidget(
                    icon: Icons.people_outline,
                    title: 'No Tenants',
                    subtitle: 'Add your first tenant to get started',
                  );
                }
                return NotificationListener<ScrollEndNotification>(
                  onNotification: (_) {
                    ref.read(tenantListProvider.notifier).loadMore();
                    return false;
                  },
                  child: RefreshIndicator(
                    onRefresh: () =>
                        ref.read(tenantListProvider.notifier).refresh(),
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: paginated.tenants.length,
                      itemBuilder: (context, index) =>
                          _TenantCard(tenant: paginated.tenants[index]),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final filters = [
      {'label': 'All', 'value': 'all'},
      {'label': 'Active', 'value': 'active'},
      {'label': 'Expired', 'value': 'expired'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: filters.map((filter) {
          final isSelected = _selectedFilter == filter['value'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(filter['label']!),
              selected: isSelected,
              onSelected: (_) {
                setState(() => _selectedFilter = filter['value']!);
                ref.read(tenantListProvider.notifier).filterByStatus(
                      _selectedFilter == 'all' ? null : _selectedFilter,
                    );
              },
              selectedColor: AppTheme.primaryBlue.withValues(alpha: 0.12),
              checkmarkColor: AppTheme.primaryBlue,
              labelStyle: TextStyle(
                color: isSelected ? AppTheme.primaryBlue : AppTheme.gray600,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _TenantCard extends StatelessWidget {
  final Tenant tenant;
  const _TenantCard({required this.tenant});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/tenants/${tenant.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              _buildAvatar(context),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            tenant.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                        _buildStatusBadge(context),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${tenant.displayProperty} - ${tenant.displayUnit}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.attach_money,
                            size: 14, color: AppTheme.gray500),
                        const SizedBox(width: 2),
                        Text(
                          EtbFormatter.format(tenant.monthlyRent),
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.gray600,
                                    fontWeight: FontWeight.w500,
                                  ),
                        ),
                        const SizedBox(width: 12),
                        if (tenant.leaseEnd != null) ...[
                          Icon(Icons.calendar_today,
                              size: 14, color: AppTheme.gray500),
                          const SizedBox(width: 2),
                          Text(
                            'Ends ${DateFormat('MMM dd, yyyy').format(tenant.leaseEnd!)}',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppTheme.gray500),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right, color: AppTheme.gray400),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar(BuildContext context) {
    return CircleAvatar(
      radius: 24,
      backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
      child: Text(
        tenant.initials,
        style: const TextStyle(
          color: AppTheme.primaryBlue,
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context) {
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        tenant.status[0].toUpperCase() + tenant.status.substring(1),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}
