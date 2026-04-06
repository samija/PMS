import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../application/property_provider.dart';
import '../domain/property.dart' as prop;

class PropertyDetailScreen extends ConsumerWidget {
  final String propertyId;
  const PropertyDetailScreen({super.key, required this.propertyId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyAsync = ref.watch(propertyDetailProvider(propertyId));
    final unitsAsync = ref.watch(propertyUnitsProvider(propertyId));

    return Scaffold(
      appBar: AppBar(title: const Text('Property Details')),
      body: propertyAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(message: e.toString()),
        data: (property) {
          if (property == null) {
            return const Center(child: Text('Property not found'));
          }
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                if (property.primaryImageUrl.isNotEmpty)
                  Image.network(
                    property.primaryImageUrl,
                    height: 220,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _placeholderImage(),
                  )
                else
                  _placeholderImage(),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name & type
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              property.name,
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              property.type.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryBlue,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              property.address.displayAddress,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Colors.grey,
                                  ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Stats row
                      Row(
                        children: [
                          _StatCard(label: 'Floors', value: '${property.totalFloors}', icon: Icons.layers),
                          const SizedBox(width: 12),
                          _StatCard(label: 'Units', value: '${property.totalUnits}', icon: Icons.door_front_door),
                          const SizedBox(width: 12),
                          _StatCard(
                            label: 'Status',
                            value: property.isListed ? 'Listed' : 'Unlisted',
                            icon: Icons.visibility,
                          ),
                        ],
                      ),

                      if (property.description != null && property.description!.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        Text('Description', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text(property.description!),
                      ],

                      if (property.amenities.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        Text('Amenities', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: property.amenities
                              .map((a) => Chip(label: Text(a)))
                              .toList(),
                        ),
                      ],

                      const SizedBox(height: 20),
                      Text('Units', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),

                      unitsAsync.when(
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (e, _) => Text('Failed to load units: $e'),
                        data: (units) {
                          if (units.isEmpty) {
                            return const Padding(
                              padding: EdgeInsets.all(16),
                              child: Text('No units added yet'),
                            );
                          }
                          return Column(
                            children: units.map((unit) => _UnitTile(unit: unit)).toList(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _placeholderImage() => Container(
        height: 180,
        color: AppTheme.primaryBlue.withValues(alpha: 0.1),
        child: const Center(
          child: Icon(Icons.apartment, size: 64, color: AppTheme.primaryBlue),
        ),
      );
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _StatCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primaryBlue),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _UnitTile extends StatelessWidget {
  final prop.Unit unit;
  const _UnitTile({required this.unit});

  Color get _statusColor => switch (unit.status) {
        'occupied' => AppTheme.primaryBlue,
        'vacant' => AppTheme.warning,
        'reserved' => Colors.blue,
        'maintenance' => AppTheme.errorRed,
        _ => Colors.grey,
      };

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _statusColor.withValues(alpha: 0.1),
          child: Icon(Icons.door_front_door, color: _statusColor),
        ),
        title: Text('Unit ${unit.unitNumber}'),
        subtitle: Text('${unit.type} | Floor ${unit.floor} | ${unit.size} sqm'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              EtbFormatter.format(unit.totalPrice),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: _statusColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                unit.status,
                style: TextStyle(fontSize: 11, color: _statusColor, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
