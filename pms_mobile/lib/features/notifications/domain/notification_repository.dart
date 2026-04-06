import 'package:dartz/dartz.dart';
import '../../../core/errors/failures.dart';
import 'app_notification.dart';

abstract class NotificationRepository {
  Future<Either<Failure, PaginatedNotifications>> getNotifications({int page = 1, String? type, bool? isRead});
  Future<Either<Failure, int>> getUnreadCount();
  Future<Either<Failure, void>> markAsRead(String id);
  Future<Either<Failure, void>> markAllRead();
  Future<Either<Failure, void>> deleteNotification(String id);
}
