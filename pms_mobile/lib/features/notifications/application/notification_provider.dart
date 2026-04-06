import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/app_notification.dart';
import '../domain/notification_repository.dart';
import '../infrastructure/notification_remote_data_source.dart';
import '../infrastructure/notification_repository_impl.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return NotificationRepositoryImpl(NotificationRemoteDataSource(dio));
});

final notificationListProvider =
    AsyncNotifierProvider<NotificationListNotifier, PaginatedNotifications>(
        NotificationListNotifier.new);

class NotificationListNotifier extends AsyncNotifier<PaginatedNotifications> {
  int _currentPage = 1;

  @override
  Future<PaginatedNotifications> build() => _fetch();

  NotificationRepository get _repo => ref.read(notificationRepositoryProvider);

  Future<PaginatedNotifications> _fetch() async {
    final result = await _repo.getNotifications(page: _currentPage);
    return result.fold(
      (f) => throw Exception(f.message),
      (data) => data,
    );
  }

  Future<void> refresh() async {
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> markAsRead(String id) async {
    await _repo.markAsRead(id);
    final current = state.value;
    if (current != null) {
      state = AsyncData(PaginatedNotifications(
        notifications: current.notifications
            .map((n) => n.id == id
                ? AppNotification(
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    isRead: true,
                    metadata: n.metadata,
                    createdAt: n.createdAt,
                  )
                : n)
            .toList(),
        total: current.total,
        page: current.page,
        pages: current.pages,
      ));
    }
    ref.invalidate(unreadCountProvider);
  }

  Future<void> markAllRead() async {
    await _repo.markAllRead();
    final current = state.value;
    if (current != null) {
      state = AsyncData(PaginatedNotifications(
        notifications: current.notifications
            .map((n) => AppNotification(
                  id: n.id,
                  type: n.type,
                  title: n.title,
                  message: n.message,
                  isRead: true,
                  metadata: n.metadata,
                  createdAt: n.createdAt,
                ))
            .toList(),
        total: current.total,
        page: current.page,
        pages: current.pages,
      ));
    }
    ref.invalidate(unreadCountProvider);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || _currentPage >= current.pages) return;
    _currentPage++;
    final result = await _repo.getNotifications(page: _currentPage);
    result.fold(
      (_) => _currentPage--,
      (newData) {
        state = AsyncData(PaginatedNotifications(
          notifications: [...current.notifications, ...newData.notifications],
          total: newData.total,
          page: newData.page,
          pages: newData.pages,
        ));
      },
    );
  }
}

final unreadCountProvider = FutureProvider<int>((ref) async {
  final repo = ref.read(notificationRepositoryProvider);
  final result = await repo.getUnreadCount();
  return result.fold(
    (f) => 0,
    (count) => count,
  );
});
