import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class MaintenanceRemoteDataSource {
  final Dio _dio;

  MaintenanceRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> getRequests({
    int page = 1,
    int limit = 10,
    String? status,
    String? priority,
  }) async {
    final response = await _dio.get(ApiConstants.maintenance, queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (priority != null) 'priority': priority,
    });
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getRequest(String id) async {
    final response = await _dio.get(ApiConstants.maintenanceRequest(id));
    return response.data['data'];
  }

  Future<Map<String, dynamic>> createRequest({
    required String title,
    required String description,
    required String category,
    String priority = 'medium',
    List<String> imagePaths = const [],
  }) async {
    final data = {
      'title': title,
      'description': description,
      'category': category,
      'priority': priority,
    };

    if (imagePaths.isNotEmpty) {
      final formData = FormData.fromMap({
        ...data,
        'images': await Future.wait(
          imagePaths.map((path) => MultipartFile.fromFile(path)),
        ),
      });
      final response = await _dio.post(ApiConstants.maintenance, data: formData);
      return response.data['data'];
    }

    final response = await _dio.post(ApiConstants.maintenance, data: data);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> submitFeedback({
    required String requestId,
    required int rating,
    String? feedback,
  }) async {
    final response = await _dio.post(
      ApiConstants.maintenanceFeedback(requestId),
      data: {
        'rating': rating,
        if (feedback != null) 'feedback': feedback,
      },
    );
    return response.data['data'];
  }
}
