import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/shimmer_widgets.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../application/maintenance_provider.dart';
import '../domain/maintenance_request.dart';

class MaintenanceListScreen extends ConsumerWidget {
  const MaintenanceListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(maintenanceListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance'),
        actions: [
          PopupMenuButton<String?>(
            icon: const Icon(Icons.filter_list),
            onSelected: (value) {
              ref.read(maintenanceListProvider.notifier).setFilter(status: value);
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: null, child: Text('All')),
              const PopupMenuItem(value: 'submitted', child: Text('Submitted')),
              const PopupMenuItem(value: 'in_progress', child: Text('In Progress')),
              const PopupMenuItem(value: 'completed', child: Text('Completed')),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/maintenance/create'),
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(maintenanceListProvider.notifier).refresh(),
        child: requestsAsync.when(
          loading: () => const ShimmerMaintenanceList(),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.read(maintenanceListProvider.notifier).refresh(),
          ),
          data: (data) {
            if (data.requests.isEmpty) {
              return const EmptyStateWidget(
                icon: Icons.build_outlined,
                title: 'No Maintenance Requests',
                subtitle: 'Submit a request when you need something fixed',
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: data.requests.length,
              itemBuilder: (_, i) => _RequestCard(
                request: data.requests[i],
                onTap: () => context.go('/maintenance/${data.requests[i].id}'),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final MaintenanceRequest request;
  final VoidCallback onTap;
  const _RequestCard({required this.request, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _PriorityDot(priority: request.priority),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      request.title,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  _StatusChip(status: request.status),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                request.description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.outline,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.category, size: 14, color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 4),
                  Text(request.category, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(width: 16),
                  Icon(Icons.access_time, size: 14, color: Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 4),
                  Text(
                    request.createdAt != null ? DateHelper.timeAgo(request.createdAt!) : '',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriorityDot extends StatelessWidget {
  final String priority;
  const _PriorityDot({required this.priority});

  @override
  Widget build(BuildContext context) {
    final color = switch (priority) {
      'emergency' => AppTheme.errorRed,
      'high' => Colors.orange,
      'medium' => AppTheme.warning,
      'low' => AppTheme.primaryBlue,
      _ => Colors.grey,
    };
    return Container(width: 10, height: 10, decoration: BoxDecoration(
      color: color, shape: BoxShape.circle,
    ));
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
