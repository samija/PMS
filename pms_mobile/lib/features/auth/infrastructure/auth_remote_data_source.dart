import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class AuthRemoteDataSource {
  final Dio _dio;

  AuthRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );
    return response.data['data'];
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    final response = await _dio.post(
      ApiConstants.register,
      data: {
        'email': email,
        'password': password,
        'name': name,
        if (phone != null) 'phone': phone,
      },
    );
    return response.data['data'];
  }

  Future<Map<String, dynamic>> googleSignIn(String idToken) async {
    final response = await _dio.post(
      '${ApiConstants.googleAuth}/mobile',
      data: {'idToken': idToken},
    );
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get(ApiConstants.profile);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> updateProfile({String? name, String? phone}) async {
    final response = await _dio.put(
      ApiConstants.profile,
      data: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
      },
    );
    return response.data['data'];
  }
}
