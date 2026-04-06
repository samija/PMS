import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../tenant_dashboard/application/tenant_dashboard_provider.dart';
import '../application/payment_provider.dart';
import '../domain/payment.dart';

class PayRentScreen extends ConsumerStatefulWidget {
  const PayRentScreen({super.key});

  @override
  ConsumerState<PayRentScreen> createState() => _PayRentScreenState();
}

class _PayRentScreenState extends ConsumerState<PayRentScreen> {
  String? _selectedGateway;
  final _now = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final tenancyAsync = ref.watch(tenancyProvider);
    final gatewaysAsync = ref.watch(gatewaysProvider);
    final payRentState = ref.watch(payRentProvider);

    ref.listen<PayRentState>(payRentProvider, (prev, next) {
      if (next is PayRentCheckout) {
        context.go('/payments/webview', extra: {
          'checkoutUrl': next.checkoutUrl,
          'txRef': next.txRef,
        });
      } else if (next is PayRentError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message), backgroundColor: AppTheme.errorRed),
        );
      } else if (next is PayRentSuccess) {
        context.go('/payments/result', extra: next.payment);
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Pay Rent')),
      body: tenancyAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (tenancy) {
          if (tenancy == null) {
            return const Center(child: Text('No active tenancy'));
          }

          final rent = tenancy.leaseAgreement?.monthlyRent ?? 0;
          final isLoading = payRentState is PayRentLoading;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Rent amount
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text('Amount Due', style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.outline,
                      )),
                      const SizedBox(height: 8),
                      Text(
                        EtbFormatter.format(rent),
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateHelper.monthYear(_now.month, _now.year),
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Payment gateway selection
              Text('Select Payment Method', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),

              gatewaysAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Failed to load gateways: $e'),
                data: (gateways) => Column(
                  children: [
                    ...gateways.map((gw) => _GatewayOption(
                      gateway: gw,
                      isSelected: _selectedGateway == gw.type,
                      onTap: () => setState(() => _selectedGateway = gw.type),
                    )),
                    _GatewayOption(
                      gateway: const PaymentGateway(type: 'bank_transfer', name: 'Bank Transfer'),
                      isSelected: _selectedGateway == 'bank_transfer',
                      onTap: () => setState(() => _selectedGateway = 'bank_transfer'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Pay button
              FilledButton(
                onPressed: isLoading || _selectedGateway == null
                    ? null
                    : () => _handlePay(tenancy.id, rent),
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Proceed to Pay'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _handlePay(String tenantId, num amount) {
    if (_selectedGateway == 'bank_transfer') {
      context.go('/payments/bank-transfer', extra: {
        'tenantId': tenantId,
        'amount': amount,
        'month': _now.month,
        'year': _now.year,
      });
      return;
    }
    ref.read(payRentProvider.notifier).initializePayment(
      tenantId: tenantId,
      amount: amount,
      type: 'rent',
      month: _now.month,
      year: _now.year,
      gateway: _selectedGateway,
    );
  }
}

class _GatewayOption extends StatelessWidget {
  final PaymentGateway gateway;
  final bool isSelected;
  final VoidCallback onTap;

  const _GatewayOption({
    required this.gateway,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconData = switch (gateway.type) {
      'chapa' => Icons.credit_card,
      'telebirr' => Icons.phone_android,
      'santimpay' => Icons.account_balance,
      'bank_transfer' => Icons.account_balance_wallet,
      _ => Icons.payment,
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isSelected
            ? BorderSide(color: AppTheme.primaryBlue, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(iconData, color: isSelected ? AppTheme.primaryBlue : null),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(gateway.name, style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    )),
                    if (gateway.description != null)
                      Text(gateway.description!, style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle, color: AppTheme.primaryBlue),
            ],
          ),
        ),
      ),
    );
  }
}
