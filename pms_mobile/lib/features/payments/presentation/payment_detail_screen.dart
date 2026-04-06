import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../application/payment_provider.dart';

class PaymentDetailScreen extends ConsumerWidget {
  final String paymentId;
  const PaymentDetailScreen({super.key, required this.paymentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentAsync = ref.watch(paymentDetailProvider(paymentId));

    return Scaffold(
      appBar: AppBar(title: const Text('Payment Details')),
      body: paymentAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(message: e.toString()),
        data: (payment) {
          if (payment == null) return const Center(child: Text('Payment not found'));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Amount card
              Card(
                color: payment.isCompleted ? AppTheme.primaryBlue : null,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Text(
                        EtbFormatter.format(payment.amount),
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: payment.isCompleted ? Colors.white : null,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          payment.status.toUpperCase(),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: payment.isCompleted ? Colors.white : null,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Details
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Payment Details', style: Theme.of(context).textTheme.titleMedium),
                      const Divider(height: 24),
                      _DetailRow('Type', payment.type.toUpperCase()),
                      _DetailRow('Method', payment.paymentMethod?.replaceAll('_', ' ').toUpperCase() ?? '-'),
                      if (payment.month != null && payment.year != null)
                        _DetailRow('Period', DateHelper.monthYear(payment.month!, payment.year!)),
                      if (payment.dueDate != null)
                        _DetailRow('Due Date', DateHelper.formatDate(payment.dueDate!)),
                      if (payment.paidAt != null)
                        _DetailRow('Paid At', DateHelper.formatDateTime(payment.paidAt!)),
                      if (payment.receipt?.number != null)
                        _DetailRow('Receipt #', payment.receipt!.number!),
                      if (payment.chapaTxRef != null)
                        _DetailRow('Transaction Ref', payment.chapaTxRef!),
                      if (payment.gatewayTransactionRef != null)
                        _DetailRow('Gateway Ref', payment.gatewayTransactionRef!),
                      if (payment.bankTransferApprovalStatus != null)
                        _DetailRow('Approval Status',
                            payment.bankTransferApprovalStatus!.replaceAll('_', ' ').toUpperCase()),
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
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.outline,
            )),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            )),
          ),
        ],
      ),
    );
  }
}
