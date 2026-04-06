import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../payments/application/payment_provider.dart';
import '../../payments/domain/payment.dart';

/// Selected calendar month state.
final calendarMonthProvider = NotifierProvider<_CalendarMonthNotifier, DateTime>(
  _CalendarMonthNotifier.new,
);

class _CalendarMonthNotifier extends Notifier<DateTime> {
  @override
  DateTime build() => DateTime(DateTime.now().year, DateTime.now().month);

  void set(DateTime value) => state = value;
}

/// Fetches all payments for calendar display.
final calendarPaymentsProvider = FutureProvider<List<Payment>>((ref) async {
  final repo = ref.read(paymentRepositoryProvider);
  final result = await repo.getPayments(limit: 100);
  return result.fold(
    (f) => throw Exception(f.message),
    (data) => data.payments,
  );
});

class PaymentCalendarScreen extends ConsumerWidget {
  const PaymentCalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(calendarMonthProvider);
    final paymentsAsync = ref.watch(calendarPaymentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Calendar'),
      ),
      body: paymentsAsync.when(
        loading: () => const LoadingWidget(message: 'Loading calendar...'),
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(calendarPaymentsProvider),
        ),
        data: (payments) {
          return Column(
            children: [
              // Month navigation
              _CalendarMonthHeader(
                current: selectedMonth,
                onPrevious: () {
                  ref.read(calendarMonthProvider.notifier).set(
                      DateTime(selectedMonth.year, selectedMonth.month - 1));
                },
                onNext: () {
                  ref.read(calendarMonthProvider.notifier).set(
                      DateTime(selectedMonth.year, selectedMonth.month + 1));
                },
              ),

              // Day-of-week headers
              _DayOfWeekHeaders(),

              // Calendar grid
              Expanded(
                child: _CalendarGrid(
                  month: selectedMonth,
                  payments: payments,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CalendarMonthHeader extends StatelessWidget {
  final DateTime current;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  const _CalendarMonthHeader({
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
            style: IconButton.styleFrom(backgroundColor: AppTheme.gray100),
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
            style: IconButton.styleFrom(backgroundColor: AppTheme.gray100),
          ),
        ],
      ),
    );
  }
}

class _DayOfWeekHeaders extends StatelessWidget {
  static const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: _days
            .map((day) => Expanded(
                  child: Center(
                    child: Text(
                      day,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.gray500,
                          ),
                    ),
                  ),
                ))
            .toList(),
      ),
    );
  }
}

class _CalendarGrid extends ConsumerWidget {
  final DateTime month;
  final List<Payment> payments;

  const _CalendarGrid({required this.month, required this.payments});

  /// Group payments by their due date day number for the given month.
  Map<int, List<Payment>> _groupByDay() {
    final map = <int, List<Payment>>{};
    for (final payment in payments) {
      DateTime? date;
      if (payment.dueDate != null) {
        date = DateTime.tryParse(payment.dueDate!);
      } else if (payment.paidAt != null) {
        date = DateTime.tryParse(payment.paidAt!);
      } else if (payment.month != null && payment.year != null) {
        // Default to first of the month for display
        date = DateTime(payment.year!, payment.month!, 1);
      }
      if (date != null &&
          date.year == month.year &&
          date.month == month.month) {
        map.putIfAbsent(date.day, () => []).add(payment);
      }
    }
    return map;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final paymentsByDay = _groupByDay();
    final firstDay = DateTime(month.year, month.month, 1);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    // Monday = 1, Sunday = 7. We need offset for Monday-start grid.
    final startWeekday = firstDay.weekday; // 1=Mon ... 7=Sun
    final totalCells = startWeekday - 1 + daysInMonth;
    final rows = (totalCells / 7).ceil();

    final today = DateTime.now();
    final isCurrentMonth =
        today.year == month.year && today.month == month.month;

    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        childAspectRatio: 1,
      ),
      itemCount: rows * 7,
      itemBuilder: (context, index) {
        final dayOffset = index - (startWeekday - 1);
        if (dayOffset < 0 || dayOffset >= daysInMonth) {
          return const SizedBox.shrink();
        }

        final day = dayOffset + 1;
        final isToday = isCurrentMonth && today.day == day;
        final dayPayments = paymentsByDay[day];
        final hasPayments = dayPayments != null && dayPayments.isNotEmpty;

        return GestureDetector(
          onTap: hasPayments
              ? () => _showDayPayments(context, day, dayPayments)
              : null,
          child: Container(
            margin: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: isToday
                  ? AppTheme.primaryBlue.withValues(alpha: 0.1)
                  : null,
              borderRadius: BorderRadius.circular(8),
              border: isToday
                  ? Border.all(color: AppTheme.primaryBlue, width: 1.5)
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$day',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight:
                            isToday ? FontWeight.bold : FontWeight.normal,
                        color: isToday ? AppTheme.primaryBlue : null,
                      ),
                ),
                if (hasPayments) ...[
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: dayPayments.take(3).map((p) {
                      final color = p.isCompleted
                          ? AppTheme.success
                          : p.isOverdue
                              ? AppTheme.errorRed
                              : AppTheme.warning;
                      return Container(
                        width: 6,
                        height: 6,
                        margin: const EdgeInsets.symmetric(horizontal: 1),
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  void _showDayPayments(
      BuildContext context, int day, List<Payment> dayPayments) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.gray300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Text(
                  DateFormat('MMMM d, yyyy')
                      .format(DateTime(month.year, month.month, day)),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 12),
                if (dayPayments.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: Text('No payments on this day')),
                  )
                else
                  ...dayPayments.map((payment) => _BottomSheetPaymentTile(
                        payment: payment,
                      )),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _BottomSheetPaymentTile extends StatelessWidget {
  final Payment payment;

  const _BottomSheetPaymentTile({required this.payment});

  @override
  Widget build(BuildContext context) {
    final statusColor = payment.isCompleted
        ? AppTheme.success
        : payment.isOverdue
            ? AppTheme.errorRed
            : AppTheme.warning;
    final statusLabel = payment.isCompleted
        ? 'Paid'
        : payment.isOverdue
            ? 'Overdue'
            : 'Pending';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.gray50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.gray200),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(2),
            ),
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
                const SizedBox(height: 2),
                Text(
                  statusLabel,
                  style: TextStyle(
                    fontSize: 12,
                    color: statusColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Text(
            EtbFormatter.format(payment.amount),
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }
}
