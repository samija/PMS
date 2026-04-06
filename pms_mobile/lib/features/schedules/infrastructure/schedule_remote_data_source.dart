import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';

class ScheduleRemoteDataSource {
  final Dio _dio;

  ScheduleRemoteDataSource(this._dio);

  Future<List<dynamic>> getMySchedules({int? month, int? year}) async {
    final response = await _dio.get(ApiConstants.mySchedules, queryParameters: {
      if (month != null) 'month': month,
      if (year != null) 'year': year,
    });
    return response.data['data'] as List<dynamic>;
  }

  Future<List<dynamic>> getCalendarData(int year, int month) async {
    final response = await _dio.get(ApiConstants.paymentCalendar, queryParameters: {
      'year': year,
      'month': month,
    });
    return response.data['data'] as List<dynamic>;
  }
}
