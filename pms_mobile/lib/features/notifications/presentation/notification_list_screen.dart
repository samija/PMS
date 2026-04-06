import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart' show DateHelper;
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../application/notification_provider.dart';
import '../domain/app_notification.dart';

class NotificationListScreen extends ConsumerWidget {
  const NotificationListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () => ref.read(notificationListProvider.notifier).markAllRead(),
            child: const Text('Mark All Read'),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.read(notificationListProvider.notifier).refresh(),
        ),
        data: (paginated) {
          if (paginated.notifications.isEmpty) {
            return const EmptyStateWidget(
              icon: Icons.notifications_none,
              title: 'No Notifications',
              subtitle: 'You\'re all caught up!',
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(notificationListProvider.notifier).refresh(),
            child: ListView.separated(
              itemCount: paginated.notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notification = paginated.notifications[index];
                return _NotificationTile(
                  notification: notification,
                  onTap: () {
                    if (!notification.isRead) {
                      ref.read(notificationListProvider.notifier).markAsRead(notification.id);
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  const _NotificationTile({required this.notification, required this.onTap});

  IconData get _icon => switch (notification.type) {
        'payment_due' || 'payment_overdue' => Icons.payment,
        'payment_received' || 'payment_approved' => Icons.check_circle,
        'payment_rejected' => Icons.cancel,
        'lease_expiring' => Icons.event,
        'maintenance_update' => Icons.build,
        _ => Icons.notifications,
      };

  Color get _iconColor => switch (notification.type) {
        'payment_due' => AppTheme.warning,
        'payment_overdue' || 'payment_rejected' => AppTheme.errorRed,
        'payment_received' || 'payment_approved' => AppTheme.primaryBlue,
        'lease_expiring' => Colors.orange,
        _ => Colors.blue,
      };

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      tileColor: notification.isRead ? null : AppTheme.primaryBlue.withValues(alpha: 0.04),
      leading: CircleAvatar(
        backgroundColor: _iconColor.withValues(alpha: 0.1),
        child: Icon(_icon, color: _iconColor, size: 20),
      ),
      title: Text(
        notification.title,
        style: TextStyle(
          fontWeight: notification.isRead ? FontWeight.normal : FontWeight.w600,
        ),
      ),
      subtitle: Text(
        notification.message,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: notification.createdAt != null
          ? Text(
              DateHelper.timeAgo(notification.createdAt!.toIso8601String()),
              style: Theme.of(context).textTheme.bodySmall,
            )
          : null,
    );
  }
}
