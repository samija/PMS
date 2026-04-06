import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../application/payment_provider.dart';
import '../domain/payment.dart';

class PaymentResultScreen extends ConsumerWidget {
  final Payment? payment;
  const PaymentResultScreen({super.key, this.payment});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSuccess = payment != null && payment!.isCompleted;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: (isSuccess ? AppTheme.primaryBlue : AppTheme.errorRed)
                      .withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isSuccess ? Icons.check_circle : Icons.cancel,
                  size: 72,
                  color: isSuccess ? AppTheme.primaryBlue : AppTheme.errorRed,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                isSuccess ? 'Payment Successful!' : 'Payment Failed',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              if (payment != null) ...[
                Text(
                  EtbFormatter.format(payment!.amount),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isSuccess ? AppTheme.primaryBlue : null,
                      ),
                ),
                const SizedBox(height: 8),
                if (payment!.receipt?.number != null)
                  Text(
                    'Receipt #${payment!.receipt!.number}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.outline,
                        ),
                  ),
              ] else
                Text(
                  'Your payment could not be processed. Please try again.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: () {
                  ref.read(payRentProvider.notifier).reset();
                  context.go('/dashboard');
                },
                child: const Text('Back to Dashboard'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  ref.read(payRentProvider.notifier).reset();
                  context.go('/payments');
                },
                child: const Text('View Payments'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
