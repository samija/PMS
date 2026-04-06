import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../application/payment_provider.dart';

/// Sealed state for the approval action.
sealed class ApprovalActionState {
  const ApprovalActionState();
}

class ApprovalIdle extends ApprovalActionState {
  const ApprovalIdle();
}

class ApprovalLoading extends ApprovalActionState {
  const ApprovalLoading();
}

class ApprovalSuccess extends ApprovalActionState {
  final String message;
  const ApprovalSuccess(this.message);
}

class ApprovalError extends ApprovalActionState {
  final String message;
  const ApprovalError(this.message);
}

final approvalActionProvider =
    NotifierProvider<ApprovalActionNotifier, ApprovalActionState>(
        ApprovalActionNotifier.new);

class ApprovalActionNotifier extends Notifier<ApprovalActionState> {
  @override
  ApprovalActionState build() => const ApprovalIdle();

  Future<void> approve(String paymentId) async {
    state = const ApprovalLoading();
    try {
      final repo = ref.read(paymentRepositoryProvider);
      final result = await repo.approvePayment(paymentId);
      result.fold(
        (f) => throw Exception(f.message),
        (_) {},
      );
      state = const ApprovalSuccess('Payment approved successfully');
    } catch (e) {
      state = ApprovalError(e.toString());
    }
  }

  Future<void> reject(String paymentId, String reason) async {
    state = const ApprovalLoading();
    try {
      final repo = ref.read(paymentRepositoryProvider);
      final result = await repo.rejectPayment(paymentId, reason);
      result.fold(
        (f) => throw Exception(f.message),
        (_) {},
      );
      state = const ApprovalSuccess('Payment rejected');
    } catch (e) {
      state = ApprovalError(e.toString());
    }
  }

  void reset() => state = const ApprovalIdle();
}

class ApprovalDetailScreen extends ConsumerStatefulWidget {
  final String paymentId;

  const ApprovalDetailScreen({super.key, required this.paymentId});

  @override
  ConsumerState<ApprovalDetailScreen> createState() =>
      _ApprovalDetailScreenState();
}

class _ApprovalDetailScreenState extends ConsumerState<ApprovalDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final paymentAsync = ref.watch(paymentDetailProvider(widget.paymentId));
    final approvalState = ref.watch(approvalActionProvider);

    ref.listen<ApprovalActionState>(approvalActionProvider, (prev, next) {
      if (next is ApprovalSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.message),
            backgroundColor: AppTheme.success,
          ),
        );
        Navigator.of(context).pop(true);
      } else if (next is ApprovalError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.message),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Approval Details')),
      body: paymentAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(message: e.toString()),
        data: (payment) {
          if (payment == null) {
            return const Center(child: Text('Payment not found'));
          }

          final tenantName = payment.tenantId is Map
              ? '${(payment.tenantId as Map)['firstName'] ?? ''} ${(payment.tenantId as Map)['lastName'] ?? ''}'
                  .trim()
              : 'Tenant';

          final isLoading = approvalState is ApprovalLoading;

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Amount card
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Text(
                              EtbFormatter.format(payment.amount),
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.warning.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'PENDING APPROVAL',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.warning,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Payment details card
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Payment Information',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const Divider(height: 24),
                            _DetailRow('Tenant', tenantName),
                            _DetailRow('Amount',
                                EtbFormatter.format(payment.amount)),
                            _DetailRow(
                              'Method',
                              payment.paymentMethod
                                      ?.replaceAll('_', ' ')
                                      .toUpperCase() ??
                                  '-',
                            ),
                            if (payment.month != null && payment.year != null)
                              _DetailRow(
                                'Period',
                                DateHelper.monthYear(
                                    payment.month!, payment.year!),
                              ),
                            if (payment.createdAt != null)
                              _DetailRow(
                                'Submitted',
                                DateHelper.formatDateTime(payment.createdAt!),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Receipt image section
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bank Transfer Receipt',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 12),
                            if (payment.bankTransferReceipt != null)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  payment.bankTransferReceipt!,
                                  width: double.infinity,
                                  height: 300,
                                  fit: BoxFit.cover,
                                  loadingBuilder:
                                      (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return Container(
                                      width: double.infinity,
                                      height: 300,
                                      decoration: BoxDecoration(
                                        color: AppTheme.gray100,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Center(
                                        child: CircularProgressIndicator(),
                                      ),
                                    );
                                  },
                                  errorBuilder: (context, error, stack) =>
                                      Container(
                                    width: double.infinity,
                                    height: 200,
                                    decoration: BoxDecoration(
                                      color: AppTheme.gray100,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.broken_image,
                                            size: 48, color: AppTheme.gray400),
                                        SizedBox(height: 8),
                                        Text('Failed to load receipt image'),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                            else
                              Container(
                                width: double.infinity,
                                height: 200,
                                decoration: BoxDecoration(
                                  color: AppTheme.gray100,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.gray200),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.image_not_supported,
                                        size: 48, color: AppTheme.gray400),
                                    SizedBox(height: 8),
                                    Text(
                                      'No receipt uploaded',
                                      style: TextStyle(color: AppTheme.gray500),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom action buttons
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(color: AppTheme.gray200),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: isLoading
                              ? null
                              : () => _showRejectDialog(context),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.errorRed,
                            side: const BorderSide(color: AppTheme.errorRed),
                            minimumSize: const Size(0, 48),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2),
                                )
                              : const Text('Reject'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: isLoading
                              ? null
                              : () => ref
                                  .read(approvalActionProvider.notifier)
                                  .approve(widget.paymentId),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.success,
                            minimumSize: const Size(0, 48),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Approve'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showRejectDialog(BuildContext context) {
    final reasonController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reject Payment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Please provide a reason for rejection:'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Enter rejection reason...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final reason = reasonController.text.trim();
              if (reason.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please provide a reason')),
                );
                return;
              }
              Navigator.of(dialogContext).pop();
              ref
                  .read(approvalActionProvider.notifier)
                  .reject(widget.paymentId, reason);
            },
            style: FilledButton.styleFrom(backgroundColor: AppTheme.errorRed),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.outline,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
