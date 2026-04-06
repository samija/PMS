import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class TenantRemoteDataSource {
  final Dio _dio;

  TenantRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> getMyTenancy() async {
    final response = await _dio.get(ApiConstants.myTenancy);
    return response.data['data'];
  }
}
