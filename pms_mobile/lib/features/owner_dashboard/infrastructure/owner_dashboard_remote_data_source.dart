import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class OwnerDashboardRemoteDataSource {
  final Dio _dio;

  OwnerDashboardRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> getPaymentStats() async {
    final response = await _dio.get(ApiConstants.paymentStats);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getMaintenanceStats() async {
    final response = await _dio.get(ApiConstants.maintenanceStats);
    return response.data['data'];
  }
}
