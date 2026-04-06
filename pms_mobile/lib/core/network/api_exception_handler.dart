import 'package:dio/dio.dart';
import 'package:dartz/dartz.dart';

import '../errors/failures.dart';

Either<Failure, T> handleException<T>(Object e) {
  if (e is DioException) {
    return Left(_handleDioError(e));
  }
  return Left(ServerFailure('An unexpected error occurred: $e'));
}

Failure _handleDioError(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return const NetworkFailure('Connection timed out. Please try again.');
    case DioExceptionType.connectionError:
      return const NetworkFailure();
    case DioExceptionType.badResponse:
      return _handleBadResponse(e.response);
    case DioExceptionType.cancel:
      return const ServerFailure('Request was cancelled.');
    default:
      return const NetworkFailure();
  }
}

Failure _handleBadResponse(Response? response) {
  final data = response?.data;
  final statusCode = response?.statusCode ?? 500;
  final message = data is Map ? (data['message'] as String? ?? 'Server error') : 'Server error';

  if (statusCode == 401) {
    return AuthFailure(message);
  }
  if (statusCode == 422 && data is Map && data['errors'] != null) {
    final errors = (data['errors'] as List)
        .fold<Map<String, String>>({}, (map, e) {
      if (e is Map) map[e['field'] ?? ''] = e['message'] ?? '';
      return map;
    });
    return ValidationFailure(message, fieldErrors: errors);
  }
  return ServerFailure(message, statusCode: statusCode);
}
