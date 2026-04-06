import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/shimmer_widgets.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../application/payment_provider.dart';
import '../domain/payment.dart';

class PaymentListScreen extends ConsumerStatefulWidget {
  const PaymentListScreen({super.key});

  @override
  ConsumerState<PaymentListScreen> createState() => _PaymentListScreenState();
}

class _PaymentListScreenState extends ConsumerState<PaymentListScreen> {
  String? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final paymentsAsync = ref.watch(paymentListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payments'),
        actions: [
          PopupMenuButton<String?>(
            icon: const Icon(Icons.filter_list),
            onSelected: (value) {
              setState(() => _statusFilter = value);
              ref.read(paymentListProvider.notifier).setFilter(status: value);
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: null, child: Text('All')),
              const PopupMenuItem(value: 'pending', child: Text('Pending')),
              const PopupMenuItem(value: 'completed', child: Text('Completed')),
              const PopupMenuItem(value: 'failed', child: Text('Failed')),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/payments/pay'),
        icon: const Icon(Icons.payment),
        label: const Text('Pay Rent'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(paymentListProvider.notifier).refresh(),
        child: paymentsAsync.when(
          loading: () => const ShimmerPaymentList(),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.read(paymentListProvider.notifier).refresh(),
          ),
          data: (data) {
            if (data.payments.isEmpty) {
              return EmptyStateWidget(
                icon: Icons.receipt_long,
                title: 'No Payments',
                subtitle: _statusFilter != null
                    ? 'No ${_statusFilter} payments found'
                    : 'No payment records found',
              );
            }
            return _buildPaymentList(data);
          },
        ),
      ),
    );
  }

  Widget _buildPaymentList(PaginatedPayments data) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200) {
          ref.read(paymentListProvider.notifier).loadMore();
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: data.payments.length,
        itemBuilder: (context, index) {
          return _PaymentCard(
            payment: data.payments[index],
            onTap: () => context.go('/payments/${data.payments[index].id}'),
          );
        },
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  final Payment payment;
  final VoidCallback onTap;
  const _PaymentCard({required this.payment, required this.onTap});

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
              _StatusIcon(status: payment.status),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${payment.type.toUpperCase()} Payment',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      payment.month != null && payment.year != null
                          ? DateHelper.monthYear(payment.month!, payment.year!)
                          : payment.createdAt != null
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
                  _StatusBadge(status: payment.status),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusIcon extends StatelessWidget {
  final String status;
  const _StatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (status) {
      'completed' => (Icons.check_circle, AppTheme.primaryBlue),
      'pending' => (Icons.schedule, AppTheme.warning),
      'failed' => (Icons.cancel, AppTheme.errorRed),
      _ => (Icons.receipt, Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'completed' => ('Paid', AppTheme.primaryBlue),
      'pending' => ('Pending', AppTheme.warning),
      'failed' => ('Failed', AppTheme.errorRed),
      'refunded' => ('Refunded', Colors.blue),
      _ => (status, Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
