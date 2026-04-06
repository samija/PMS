import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/application/auth_provider.dart';
import '../../auth/application/auth_state.dart';
import '../../properties/application/property_provider.dart';
import '../../notifications/application/notification_provider.dart';

class OwnerDashboardScreen extends ConsumerWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final propertiesAsync = ref.watch(propertyListProvider);
    final unreadAsync = ref.watch(unreadCountProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      appBar: AppBar(
        title: Text('Hello, ${user?.name.split(' ').first ?? 'Owner'}'),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push('/notifications'),
              ),
              unreadAsync.when(
                data: (count) => count > 0
                    ? Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: AppTheme.errorRed,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$count',
                            style: const TextStyle(color: Colors.white, fontSize: 10),
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.go('/owner-settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(propertyListProvider);
          ref.invalidate(unreadCountProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Properties summary
              propertiesAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Error: $e'),
                data: (paginated) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stats cards
                    Row(
                      children: [
                        _DashCard(
                          title: 'Properties',
                          value: '${paginated.total}',
                          icon: Icons.apartment,
                          color: AppTheme.primaryBlue,
                        ),
                        const SizedBox(width: 12),
                        _DashCard(
                          title: 'Total Units',
                          value: '${paginated.properties.fold<int>(0, (sum, p) => sum + p.totalUnits)}',
                          icon: Icons.door_front_door,
                          color: AppTheme.warning,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Quick actions
                    Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _ActionButton(
                          icon: Icons.apartment,
                          label: 'Properties',
                          color: AppTheme.primaryBlue,
                          onTap: () => context.push('/properties'),
                        ),
                        const SizedBox(width: 12),
                        _ActionButton(
                          icon: Icons.payment,
                          label: 'Payments',
                          color: AppTheme.warning,
                          onTap: () => context.go('/owner-payments'),
                        ),
                        const SizedBox(width: 12),
                        _ActionButton(
                          icon: Icons.build,
                          label: 'Maintenance',
                          color: Colors.orange,
                          onTap: () => context.push('/maintenance'),
                        ),
                        const SizedBox(width: 12),
                        _ActionButton(
                          icon: Icons.people,
                          label: 'Tenants',
                          color: Colors.blue,
                          onTap: () => context.push('/tenants'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Recent properties
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('My Properties', style: Theme.of(context).textTheme.titleMedium),
                        TextButton(
                          onPressed: () => context.push('/properties'),
                          child: const Text('See All'),
                        ),
                      ],
                    ),
                    ...paginated.properties.take(3).map((property) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            onTap: () => context.push('/properties/${property.id}'),
                            leading: CircleAvatar(
                              backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
                              child: const Icon(Icons.apartment, color: AppTheme.primaryBlue),
                            ),
                            title: Text(property.name),
                            subtitle: Text('${property.totalUnits} units | ${property.type}'),
                            trailing: Container(
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
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: property.isListed ? AppTheme.primaryBlue : Colors.grey,
                                ),
                              ),
                            ),
                          ),
                        )),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  const _DashCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: color)),
            Text(title, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(icon, color: color),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}
