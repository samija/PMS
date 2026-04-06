import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../domain/app_notification.dart';

class NotificationRemoteDataSource {
  final Dio _dio;

  NotificationRemoteDataSource(this._dio);

  Future<PaginatedNotifications> getNotifications({int page = 1, String? type, bool? isRead}) async {
    final response = await _dio.get(
      ApiConstants.notifications,
      queryParameters: {
        'page': page,
        'limit': 20,
        if (type != null) 'type': type,
        if (isRead != null) 'isRead': isRead,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? response.data;
    return PaginatedNotifications.fromJson(data);
  }

  Future<int> getUnreadCount() async {
    final response = await _dio.get(ApiConstants.unreadCount);
    return response.data['data']?['count'] as int? ?? response.data['count'] as int? ?? 0;
  }

  Future<void> markAsRead(String id) async {
    await _dio.patch(ApiConstants.markRead(id));
  }

  Future<void> markAllRead() async {
    await _dio.post(ApiConstants.markAllRead);
  }

  Future<void> deleteNotification(String id) async {
    await _dio.delete(ApiConstants.notification(id));
  }
}
