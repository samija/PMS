import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class PaymentRemoteDataSource {
  final Dio _dio;

  PaymentRemoteDataSource(this._dio);

  Future<Map<String, dynamic>> getPayments({
    int page = 1,
    int limit = 10,
    String? status,
    String? type,
  }) async {
    final response = await _dio.get(ApiConstants.payments, queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (type != null) 'type': type,
    });
    return response.data['data'];
  }

  Future<Map<String, dynamic>> getPayment(String id) async {
    final response = await _dio.get(ApiConstants.payment(id));
    return response.data['data'];
  }

  Future<Map<String, dynamic>> initializePayment({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    String? gateway,
  }) async {
    final response = await _dio.post(ApiConstants.initializePayment, data: {
      'tenantId': tenantId,
      'amount': amount,
      'type': type,
      'month': month,
      'year': year,
      if (gateway != null) 'gateway': gateway,
    });
    return response.data['data'];
  }

  Future<Map<String, dynamic>> verifyPayment(String txRef) async {
    final response = await _dio.get(ApiConstants.verifyPayment(txRef));
    return response.data['data'];
  }

  Future<List<dynamic>> getGateways() async {
    final response = await _dio.get(ApiConstants.paymentGateways);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> submitBankTransfer({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    required String receiptPath,
  }) async {
    final formData = FormData.fromMap({
      'tenantId': tenantId,
      'amount': amount,
      'type': type,
      'month': month,
      'year': year,
      'receipt': await MultipartFile.fromFile(receiptPath, filename: 'receipt.jpg'),
    });
    final response = await _dio.post(ApiConstants.bankTransfer, data: formData);
    return response.data['data'];
  }

  Future<List<dynamic>> getPendingApprovals() async {
    final response = await _dio.get(ApiConstants.pendingApproval);
    return response.data['data'];
  }

  Future<Map<String, dynamic>> approvePayment(String id) async {
    final response = await _dio.patch(ApiConstants.approvePayment(id));
    return response.data['data'];
  }

  Future<Map<String, dynamic>> rejectPayment(String id, String reason) async {
    final response = await _dio.patch(
      ApiConstants.rejectPayment(id),
      data: {'reason': reason},
    );
    return response.data['data'];
  }
}
