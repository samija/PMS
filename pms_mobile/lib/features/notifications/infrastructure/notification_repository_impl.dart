import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/app_notification.dart';
import '../domain/notification_repository.dart';
import 'notification_remote_data_source.dart';

class NotificationRepositoryImpl implements NotificationRepository {
  final NotificationRemoteDataSource _dataSource;

  NotificationRepositoryImpl(this._dataSource);

  @override
  Future<Either<Failure, PaginatedNotifications>> getNotifications({
    int page = 1,
    String? type,
    bool? isRead,
  }) async {
    try {
      return Right(await _dataSource.getNotifications(page: page, type: type, isRead: isRead));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, int>> getUnreadCount() async {
    try {
      return Right(await _dataSource.getUnreadCount());
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> markAsRead(String id) async {
    try {
      await _dataSource.markAsRead(id);
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> markAllRead() async {
    try {
      await _dataSource.markAllRead();
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> deleteNotification(String id) async {
    try {
      await _dataSource.deleteNotification(id);
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }
}
