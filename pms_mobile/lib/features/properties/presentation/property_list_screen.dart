import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/shimmer_widgets.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../application/property_provider.dart';
import '../domain/property.dart';

class PropertyListScreen extends ConsumerWidget {
  const PropertyListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertiesAsync = ref.watch(propertyListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Properties'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/properties/add'),
          ),
        ],
      ),
      body: propertiesAsync.when(
        loading: () => const ShimmerPropertyList(),
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.read(propertyListProvider.notifier).refresh(),
        ),
        data: (paginated) {
          if (paginated.properties.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.apartment,
              title: 'No Properties',
              subtitle: 'Add your first property to get started',
            );
          }
          return NotificationListener<ScrollEndNotification>(
            onNotification: (_) {
              ref.read(propertyListProvider.notifier).loadMore();
              return false;
            },
            child: RefreshIndicator(
              onRefresh: () => ref.read(propertyListProvider.notifier).refresh(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: paginated.properties.length,
                itemBuilder: (context, index) =>
                    _PropertyCard(property: paginated.properties[index]),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _PropertyCard extends StatelessWidget {
  final Property property;
  const _PropertyCard({required this.property});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/properties/${property.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (property.primaryImageUrl.isNotEmpty)
              Image.network(
                property.primaryImageUrl,
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 160,
                  color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                  child: const Icon(Icons.apartment, size: 48, color: AppTheme.primaryBlue),
                ),
              )
            else
              Container(
                height: 120,
                color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                child: const Center(
                  child: Icon(Icons.apartment, size: 48, color: AppTheme.primaryBlue),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          property.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: property.isListed
                              ? AppTheme.primaryBlue.withValues(alpha: 0.1)
                              : Colors.grey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          property.isListed ? 'Listed' : 'Unlisted',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: property.isListed ? AppTheme.primaryBlue : Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    property.address.displayAddress,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _InfoChip(
                        icon: Icons.layers,
                        label: '${property.totalFloors} floors',
                      ),
                      const SizedBox(width: 12),
                      _InfoChip(
                        icon: Icons.door_front_door,
                        label: '${property.totalUnits} units',
                      ),
                      const SizedBox(width: 12),
                      _InfoChip(
                        icon: Icons.category,
                        label: property.type,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(width: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ],
    );
  }
}
