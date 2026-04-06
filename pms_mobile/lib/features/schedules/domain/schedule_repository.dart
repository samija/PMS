import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'payment_schedule.dart';

abstract class ScheduleRepository {
  Future<Either<Failure, List<PaymentSchedule>>> getMySchedules({int? month, int? year});
  Future<Either<Failure, List<PaymentSchedule>>> getCalendarData(int year, int month);
}
