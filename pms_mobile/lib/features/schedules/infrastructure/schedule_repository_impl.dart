import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../../core/errors/failures.dart';
import '../domain/payment_schedule.dart';
import '../domain/schedule_repository.dart';
import 'schedule_remote_data_source.dart';

class ScheduleRepositoryImpl implements ScheduleRepository {
  final ScheduleRemoteDataSource _remoteDataSource;

  ScheduleRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<PaymentSchedule>>> getMySchedules({int? month, int? year}) async {
    try {
      final data = await _remoteDataSource.getMySchedules(month: month, year: year);
      final schedules = data.map((e) => PaymentSchedule.fromJson(e as Map<String, dynamic>)).toList();
      return Right(schedules);
    } on DioException catch (e) {
      return Left(ServerFailure(e.response?.data?['message'] ?? 'Failed to load schedules'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<PaymentSchedule>>> getCalendarData(int year, int month) async {
    try {
      final data = await _remoteDataSource.getCalendarData(year, month);
      final schedules = data.map((e) => PaymentSchedule.fromJson(e as Map<String, dynamic>)).toList();
      return Right(schedules);
    } on DioException catch (e) {
      return Left(ServerFailure(e.response?.data?['message'] ?? 'Failed to load calendar'));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
