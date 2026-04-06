import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/maintenance_request.dart';
import '../domain/maintenance_repository.dart';
import 'maintenance_remote_data_source.dart';

class MaintenanceRepositoryImpl implements MaintenanceRepository {
  final MaintenanceRemoteDataSource _remoteDataSource;

  MaintenanceRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, PaginatedMaintenance>> getRequests({
    int page = 1,
    int limit = 10,
    String? status,
    String? priority,
  }) async {
    try {
      final data = await _remoteDataSource.getRequests(
        page: page, limit: limit, status: status, priority: priority,
      );
      final requests = (data['maintenanceRequests'] as List? ?? data['requests'] as List? ?? [])
          .map((e) => MaintenanceRequest.fromJson(e as Map<String, dynamic>))
          .toList();
      final pagination = data['pagination'] as Map<String, dynamic>;
      return Right(PaginatedMaintenance(
        requests: requests,
        total: pagination['total'] as int,
        page: pagination['page'] as int,
        pages: pagination['pages'] as int,
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, MaintenanceRequest>> getRequest(String id) async {
    try {
      final data = await _remoteDataSource.getRequest(id);
      return Right(MaintenanceRequest.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, MaintenanceRequest>> createRequest({
    required String title,
    required String description,
    required String category,
    String priority = 'medium',
    List<String> imagePaths = const [],
  }) async {
    try {
      final data = await _remoteDataSource.createRequest(
        title: title,
        description: description,
        category: category,
        priority: priority,
        imagePaths: imagePaths,
      );
      return Right(MaintenanceRequest.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, MaintenanceRequest>> submitFeedback({
    required String requestId,
    required int rating,
    String? feedback,
  }) async {
    try {
      final data = await _remoteDataSource.submitFeedback(
        requestId: requestId,
        rating: rating,
        feedback: feedback,
      );
      return Right(MaintenanceRequest.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }
}
