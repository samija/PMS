import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../payments/application/payment_provider.dart';
import '../../payments/domain/payment.dart';

/// Selected month/year state for the schedule view.
final selectedScheduleMonthProvider = NotifierProvider<_SelectedScheduleMonthNotifier, DateTime>(
  _SelectedScheduleMonthNotifier.new,
);

class _SelectedScheduleMonthNotifier extends Notifier<DateTime> {
  @override
  DateTime build() => DateTime(DateTime.now().year, DateTime.now().month);

  void set(DateTime value) => state = value;
}

/// Fetches payments for the selected month/year to display as a schedule.
final schedulePaymentsProvider = FutureProvider<List<Payment>>((ref) async {
  final selectedMonth = ref.watch(selectedScheduleMonthProvider);
  final repo = ref.read(paymentRepositoryProvider);
  final result = await repo.getPayments(limit: 50);
  return result.fold(
    (f) => throw Exception(f.message),
    (data) => data.payments
        .where((p) =>
            p.month == selectedMonth.month && p.year == selectedMonth.year)
        .toList(),
  );
});

class ScheduleListScreen extends ConsumerWidget {
  const ScheduleListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(selectedScheduleMonthProvider);
    final schedulesAsync = ref.watch(schedulePaymentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Schedule'),
      ),
      body: Column(
        children: [
          // Month/Year selector
          _MonthSelector(
            current: selectedMonth,
            onPrevious: () {
              ref.read(selectedScheduleMonthProvider.notifier).set(
                  DateTime(selectedMonth.year, selectedMonth.month - 1));
            },
            onNext: () {
              ref.read(selectedScheduleMonthProvider.notifier).set(
                  DateTime(selectedMonth.year, selectedMonth.month + 1));
            },
          ),

          // Content
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(schedulePaymentsProvider.future),
              child: schedulesAsync.when(
                loading: () =>
                    const LoadingWidget(message: 'Loading schedule...'),
                error: (e, _) => AppErrorWidget(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(schedulePaymentsProvider),
                ),
                data: (payments) {
                  if (payments.isEmpty) {
                    return const EmptyStateWidget(
                      icon: Icons.calendar_today,
                      title: 'No Scheduled Payments',
                      subtitle:
                          'No payments scheduled for this month',
                    );
                  }
                  return _ScheduleContent(payments: payments);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthSelector extends StatelessWidget {
  final DateTime current;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _MonthSelector({
    required this.current,
    required this.onPrevious,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: onPrevious,
            icon: const Icon(Icons.chevron_left),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.gray100,
            ),
          ),
          Text(
            DateFormat('MMMM yyyy').format(current),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          IconButton(
            onPressed: onNext,
            icon: const Icon(Icons.chevron_right),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.gray100,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleContent extends StatelessWidget {
  final List<Payment> payments;

  const _ScheduleContent({required this.payments});

  @override
  Widget build(BuildContext context) {
    final totalDue =
        payments.fold<num>(0, (sum, p) => sum + p.amount);
    final totalPaid = payments
        .where((p) => p.isCompleted)
        .fold<num>(0, (sum, p) => sum + p.amount);
    final remaining = totalDue - totalPaid;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Summary card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Summary',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                _SummaryRow(
                  label: 'Total Due',
                  amount: totalDue,
                  color: AppTheme.gray700,
                ),
                const SizedBox(height: 8),
                _SummaryRow(
                  label: 'Paid',
                  amount: totalPaid,
                  color: AppTheme.success,
                ),
                const Divider(height: 16),
                _SummaryRow(
                  label: 'Remaining',
                  amount: remaining,
                  color: remaining > 0 ? AppTheme.errorRed : AppTheme.success,
                  bold: true,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Schedule items
        ...payments.map((payment) => _ScheduleItemCard(payment: payment)),
      ],
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final num amount;
  final Color color;
  final bool bold;

  const _SummaryRow({
    required this.label,
    required this.amount,
    required this.color,
    this.bold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.gray600,
                fontWeight: bold ? FontWeight.w600 : null,
              ),
        ),
        Text(
          EtbFormatter.format(amount),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: color,
                fontWeight: bold ? FontWeight.bold : FontWeight.w500,
              ),
        ),
      ],
    );
  }
}

class _ScheduleItemCard extends StatelessWidget {
  final Payment payment;

  const _ScheduleItemCard({required this.payment});

  _ScheduleStatus get _status {
    if (payment.isCompleted) return _ScheduleStatus.paid;
    if (payment.isOverdue) return _ScheduleStatus.overdue;
    return _ScheduleStatus.upcoming;
  }

  @override
  Widget build(BuildContext context) {
    final status = _status;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            if (status == _ScheduleStatus.paid)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, color: AppTheme.success, size: 20),
              )
            else
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: status.color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.schedule, color: status.color, size: 20),
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${payment.type.toUpperCase()} Payment',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    payment.dueDate != null
                        ? 'Due: ${DateHelper.formatDate(payment.dueDate!)}'
                        : payment.month != null && payment.year != null
                            ? DateHelper.monthYear(
                                payment.month!, payment.year!)
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
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: status.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    status.label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: status.color,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

enum _ScheduleStatus {
  upcoming(AppTheme.info, 'Upcoming'),
  paid(AppTheme.success, 'Paid'),
  overdue(AppTheme.errorRed, 'Overdue');

  final Color color;
  final String label;
  const _ScheduleStatus(this.color, this.label);
}
