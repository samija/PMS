import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../application/tenant_dashboard_provider.dart';
import '../domain/tenancy.dart';

class LeaseDetailScreen extends ConsumerWidget {
  const LeaseDetailScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tenancyAsync = ref.watch(tenancyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Lease Agreement')),
      body: tenancyAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(message: e.toString()),
        data: (tenancy) {
          if (tenancy == null) {
            return const Center(child: Text('No lease found'));
          }
          return _buildLeaseDetail(context, tenancy);
        },
      ),
    );
  }

  Widget _buildLeaseDetail(BuildContext context, Tenancy tenancy) {
    final lease = tenancy.leaseAgreement;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Status banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: tenancy.isActive
                ? AppTheme.primaryBlue.withValues(alpha: 0.1)
                : AppTheme.errorRed.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                tenancy.isActive ? Icons.check_circle : Icons.warning,
                color: tenancy.isActive ? AppTheme.primaryBlue : AppTheme.errorRed,
              ),
              const SizedBox(width: 12),
              Text(
                tenancy.isActive ? 'Active Lease' : 'Lease ${tenancy.status}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: tenancy.isActive ? AppTheme.primaryBlue : AppTheme.errorRed,
                    ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Property Info
        _SectionCard(
          title: 'Property',
          children: [
            _DetailRow('Property Name', tenancy.propertyId?.name ?? '-'),
            _DetailRow('Unit Number', tenancy.unitId?.unitNumber ?? '-'),
            _DetailRow('Unit Type', tenancy.unitId?.type ?? '-'),
            _DetailRow('Floor', '${tenancy.unitId?.floor ?? '-'}'),
            if (tenancy.propertyId?.address != null)
              _DetailRow('Address', tenancy.propertyId!.address!.formatted),
          ],
        ),
        const SizedBox(height: 16),

        // Lease Terms
        _SectionCard(
          title: 'Lease Terms',
          children: [
            _DetailRow('Start Date',
                lease?.startDate != null ? DateHelper.formatDate(lease!.startDate!) : '-'),
            _DetailRow('End Date',
                lease?.endDate != null ? DateHelper.formatDate(lease!.endDate!) : '-'),
            _DetailRow('Monthly Rent',
                lease?.monthlyRent != null ? EtbFormatter.format(lease!.monthlyRent!) : '-'),
            _DetailRow('Security Deposit',
                lease?.deposit != null ? EtbFormatter.format(lease!.deposit!) : '-'),
            _DetailRow('Days Remaining', '${tenancy.daysUntilLeaseEnd} days'),
          ],
        ),
        const SizedBox(height: 16),

        // Terms & Conditions
        if (lease?.terms != null && lease!.terms!.isNotEmpty) ...[
          _SectionCard(
            title: 'Terms & Conditions',
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(lease.terms!, style: Theme.of(context).textTheme.bodyMedium),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],

        // Emergency Contact
        if (tenancy.emergencyContact != null)
          _SectionCard(
            title: 'Emergency Contact',
            children: [
              _DetailRow('Name', tenancy.emergencyContact!.name ?? '-'),
              _DetailRow('Phone', tenancy.emergencyContact!.phone ?? '-'),
              _DetailRow('Relationship', tenancy.emergencyContact!.relationship ?? '-'),
            ],
          ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            )),
            const Divider(height: 24),
            ...children,
          ],
        ),
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
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
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
