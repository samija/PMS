import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/tenant.dart';

class TenantRemoteDataSource {
  final Dio _dio;

  TenantRemoteDataSource(this._dio);

  Future<PaginatedTenants> getTenants({int page = 1, String? status}) async {
    final response = await _dio.get(
      ApiConstants.tenants,
      queryParameters: {
        'page': page,
        'limit': 10,
        if (status != null && status != 'all') 'status': status,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? response.data;
    return PaginatedTenants.fromJson(data);
  }

  Future<Tenant> getTenantDetail(String id) async {
    final response = await _dio.get(ApiConstants.tenant(id));
    return Tenant.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<Tenant> addTenant(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.tenants, data: data);
    return Tenant.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<Tenant> updateTenant(String id, Map<String, dynamic> data) async {
    final response = await _dio.put(ApiConstants.tenant(id), data: data);
    return Tenant.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<void> terminateTenant(String id) async {
    await _dio.post(ApiConstants.terminateTenant(id));
  }
}
