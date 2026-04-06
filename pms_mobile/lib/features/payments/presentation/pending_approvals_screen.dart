import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../application/payment_provider.dart';
import '../domain/payment.dart';

/// Provider that filters payment list to only pending bank transfer approvals.
final pendingApprovalsProvider = FutureProvider<List<Payment>>((ref) async {
  final repo = ref.read(paymentRepositoryProvider);
  final result = await repo.getPayments(
    status: 'pending',
    limit: 50,
  );
  return result.fold(
    (f) => throw Exception(f.message),
    (data) => data.payments
        .where((p) =>
            p.paymentMethod == 'bank_transfer' &&
            p.bankTransferApprovalStatus == 'pending')
        .toList(),
  );
});

class PendingApprovalsScreen extends ConsumerWidget {
  const PendingApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingApprovalsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Approvals'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(pendingApprovalsProvider.future),
        child: pendingAsync.when(
          loading: () => const LoadingWidget(message: 'Loading pending approvals...'),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.invalidate(pendingApprovalsProvider),
          ),
          data: (payments) {
            if (payments.isEmpty) {
              return const EmptyStateWidget(
                icon: Icons.check_circle_outline,
                title: 'No Pending Approvals',
                subtitle: 'All bank transfer payments have been reviewed',
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: payments.length,
              itemBuilder: (context, index) {
                return _PendingApprovalCard(
                  payment: payments[index],
                  onTap: () => context.push(
                    '/payments/approvals/${payments[index].id}',
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _PendingApprovalCard extends StatelessWidget {
  final Payment payment;
  final VoidCallback onTap;

  const _PendingApprovalCard({required this.payment, required this.onTap});

  String get _tenantName {
    if (payment.tenantId is Map) {
      final tenant = payment.tenantId as Map;
      final firstName = tenant['firstName'] ?? '';
      final lastName = tenant['lastName'] ?? '';
      return '$firstName $lastName'.trim();
    }
    return 'Tenant';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.account_balance,
                  color: AppTheme.warning,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _tenantName,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      payment.createdAt != null
                          ? DateHelper.formatDate(payment.createdAt!)
                          : '',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.outline,
                          ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    EtbFormatter.format(payment.amount),
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (payment.bankTransferReceipt != null)
                        Icon(
                          Icons.receipt_long,
                          size: 14,
                          color: AppTheme.success,
                        ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.warning.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Pending',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.warning,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
