import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'maintenance_request.dart';

abstract class MaintenanceRepository {
  Future<Either<Failure, PaginatedMaintenance>> getRequests({
    int page = 1,
    int limit = 10,
    String? status,
    String? priority,
  });
  Future<Either<Failure, MaintenanceRequest>> getRequest(String id);
  Future<Either<Failure, MaintenanceRequest>> createRequest({
    required String title,
    required String description,
    required String category,
    String priority = 'medium',
    List<String> imagePaths = const [],
  });
  Future<Either<Failure, MaintenanceRequest>> submitFeedback({
    required String requestId,
    required int rating,
    String? feedback,
  });
}
