import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../application/listing_provider.dart';
import '../domain/booking_application.dart';

class MyApplicationsScreen extends ConsumerWidget {
  const MyApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(myApplicationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications'),
      ),
      body: applicationsAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.read(myApplicationsProvider.notifier).refresh(),
        ),
        data: (applications) {
          if (applications.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.receipt_long_outlined,
              title: 'No Applications',
              subtitle: 'You haven\'t applied to any listings yet',
            );
          }
          return RefreshIndicator(
            onRefresh: () =>
                ref.read(myApplicationsProvider.notifier).refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: applications.length,
              itemBuilder: (context, index) => _ApplicationCard(
                application: applications[index],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ApplicationCard extends ConsumerWidget {
  final BookingApplication application;
  const _ApplicationCard({required this.application});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _statusColor(application.status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.description_outlined,
                    color: _statusColor(application.status),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Listing #${application.listingId.length > 8 ? application.listingId.substring(application.listingId.length - 8) : application.listingId}',
                        style: Theme.of(context)
                            .textTheme
                            .titleSmall
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      if (application.createdAt != null)
                        Text(
                          'Applied ${DateFormat('MMM dd, yyyy').format(application.createdAt!)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: AppTheme.gray500),
                        ),
                    ],
                  ),
                ),
                _StatusBadge(status: application.status),
              ],
            ),

            // Details
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),

            // Applicant info
            _DetailRow(
              icon: Icons.person_outline,
              label: 'Name',
              value: application.applicantName,
            ),
            const SizedBox(height: 8),
            _DetailRow(
              icon: Icons.email_outlined,
              label: 'Email',
              value: application.applicantEmail,
            ),
            const SizedBox(height: 8),
            _DetailRow(
              icon: Icons.phone_outlined,
              label: 'Phone',
              value: application.applicantPhone,
            ),
            if (application.moveInDate != null) ...[
              const SizedBox(height: 8),
              _DetailRow(
                icon: Icons.calendar_today,
                label: 'Move-in',
                value:
                    DateFormat('MMM dd, yyyy').format(application.moveInDate!),
              ),
            ],
            if (application.message != null &&
                application.message!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.gray50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Message',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.gray400,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      application.message!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.gray600,
                            height: 1.4,
                          ),
                    ),
                  ],
                ),
              ),
            ],

            // Cancel button for pending applications
            if (application.isPending) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _confirmCancel(context, ref),
                  icon: const Icon(Icons.cancel_outlined,
                      color: AppTheme.errorRed, size: 18),
                  label: const Text('Cancel Application'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.errorRed,
                    side: const BorderSide(color: AppTheme.errorRed),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _confirmCancel(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text('Cancel Application'),
        content: const Text(
            'Are you sure you want to cancel this application? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('No, Keep It'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref
                  .read(myApplicationsProvider.notifier)
                  .cancelApplication(application.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success
                        ? 'Application cancelled successfully'
                        : 'Failed to cancel application'),
                    backgroundColor:
                        success ? AppTheme.success : AppTheme.errorRed,
                  ),
                );
              }
            },
            style:
                FilledButton.styleFrom(backgroundColor: AppTheme.errorRed),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return AppTheme.success;
      case 'rejected':
        return AppTheme.errorRed;
      case 'pending':
      default:
        return AppTheme.warning;
    }
  }
}

// ── Status Badge ──────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    switch (status.toLowerCase()) {
      case 'approved':
        bgColor = AppTheme.successLight;
        textColor = AppTheme.success;
        break;
      case 'rejected':
        bgColor = AppTheme.errorLight;
        textColor = AppTheme.errorRed;
        break;
      case 'pending':
      default:
        bgColor = AppTheme.warningLight;
        textColor = AppTheme.warning;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status[0].toUpperCase() + status.substring(1).toLowerCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

// ── Detail Row ────────────────────────────────────────────────────────────────

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.gray400),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: Theme.of(context)
              .textTheme
              .bodySmall
              ?.copyWith(color: AppTheme.gray400),
        ),
        Expanded(
          child: Text(
            value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.gray700,
                  fontWeight: FontWeight.w500,
                ),
          ),
        ),
      ],
    );
  }
}
