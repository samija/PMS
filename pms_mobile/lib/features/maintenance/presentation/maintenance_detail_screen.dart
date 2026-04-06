import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/loading_widget.dart';
import '../application/maintenance_provider.dart';
import '../domain/maintenance_request.dart';

class MaintenanceDetailScreen extends ConsumerWidget {
  final String requestId;
  const MaintenanceDetailScreen({super.key, required this.requestId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestAsync = ref.watch(maintenanceDetailProvider(requestId));

    return Scaffold(
      appBar: AppBar(title: const Text('Request Details')),
      body: requestAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(message: e.toString()),
        data: (request) {
          if (request == null) return const Center(child: Text('Not found'));
          return _buildDetail(context, ref, request);
        },
      ),
    );
  }

  Widget _buildDetail(BuildContext context, WidgetRef ref, MaintenanceRequest request) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(request.title, style: Theme.of(context).textTheme.titleLarge),
                    ),
                    _StatusChip(status: request.status),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _InfoChip(icon: Icons.category, label: request.category),
                    const SizedBox(width: 8),
                    _InfoChip(icon: Icons.flag, label: request.priority),
                  ],
                ),
                const SizedBox(height: 12),
                Text(request.description, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Images
        if (request.images.isNotEmpty) ...[
          Text('Photos', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: request.images.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) => ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: request.images[i],
                  width: 120,
                  height: 120,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Timeline
        Text('Status Timeline', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                for (int i = 0; i < request.timeline.length; i++)
                  _TimelineItem(
                    entry: request.timeline[i],
                    isFirst: i == 0,
                    isLast: i == request.timeline.length - 1,
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
                Text('Details', style: Theme.of(context).textTheme.titleMedium),
                const Divider(height: 24),
                _DetailRow('Assigned To', request.assignedToName),
                if (request.scheduledDate != null)
                  _DetailRow('Scheduled', DateHelper.formatDate(request.scheduledDate!)),
                if (request.completedAt != null)
                  _DetailRow('Completed', DateHelper.formatDateTime(request.completedAt!)),
                if (request.estimatedCost != null)
                  _DetailRow('Estimated Cost', EtbFormatter.format(request.estimatedCost!)),
                if (request.actualCost != null)
                  _DetailRow('Actual Cost', EtbFormatter.format(request.actualCost!)),
              ],
            ),
          ),
        ),

        // Feedback
        if (request.canSubmitFeedback) ...[
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => context.go('/maintenance/${request.id}/feedback'),
            icon: const Icon(Icons.star),
            label: const Text('Submit Feedback'),
          ),
        ],
        if (request.tenantRating != null) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Your Feedback', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(5, (i) => Icon(
                      i < request.tenantRating! ? Icons.star : Icons.star_border,
                      color: AppTheme.warning,
                    )),
                  ),
                  if (request.tenantFeedback != null) ...[
                    const SizedBox(height: 8),
                    Text(request.tenantFeedback!),
                  ],
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'submitted' => ('Submitted', Colors.blue),
      'acknowledged' => ('Acknowledged', Colors.purple),
      'assigned' => ('Assigned', Colors.indigo),
      'in_progress' => ('In Progress', AppTheme.warning),
      'completed' => ('Completed', AppTheme.primaryBlue),
      'cancelled' => ('Cancelled', Colors.grey),
      _ => (status, Colors.grey),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14),
          const SizedBox(width: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final TimelineEntry entry;
  final bool isFirst;
  final bool isLast;
  const _TimelineItem({required this.entry, required this.isFirst, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: isLast ? AppTheme.primaryBlue : Theme.of(context).colorScheme.outline,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: Theme.of(context).colorScheme.outlineVariant,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.status.replaceAll('_', ' ').toUpperCase(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  if (entry.timestamp != null)
                    Text(
                      DateHelper.formatDateTime(entry.timestamp!),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.outline,
                          ),
                    ),
                  if (entry.note != null)
                    Text(entry.note!, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
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
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.outline,
          )),
          Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w500,
          )),
        ],
      ),
    );
  }
}
