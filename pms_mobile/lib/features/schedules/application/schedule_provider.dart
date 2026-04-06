import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/payment_schedule.dart';
import '../infrastructure/schedule_remote_data_source.dart';
import '../infrastructure/schedule_repository_impl.dart';

final scheduleDataSourceProvider = Provider<ScheduleRemoteDataSource>((ref) {
  final dio = ref.watch(dioProvider);
  return ScheduleRemoteDataSource(dio);
});

final scheduleRepositoryProvider = Provider<ScheduleRepositoryImpl>((ref) {
  final dataSource = ref.watch(scheduleDataSourceProvider);
  return ScheduleRepositoryImpl(dataSource);
});

final scheduleListProvider = AsyncNotifierProvider<ScheduleListNotifier, List<PaymentSchedule>>(
  ScheduleListNotifier.new,
);

class ScheduleListNotifier extends AsyncNotifier<List<PaymentSchedule>> {
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;

  int get month => _month;
  int get year => _year;

  @override
  Future<List<PaymentSchedule>> build() async {
    return _fetch();
  }

  Future<List<PaymentSchedule>> _fetch() async {
    final repo = ref.read(scheduleRepositoryProvider);
    final result = await repo.getMySchedules(month: _month, year: _year);
    return result.fold(
      (failure) => throw Exception(failure.message),
      (schedules) => schedules,
    );
  }

  Future<void> changeMonth(int month, int year) async {
    _month = month;
    _year = year;
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetch());
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetch());
  }
}

final calendarDataProvider = FutureProvider.family<List<PaymentSchedule>, ({int year, int month})>(
  (ref, params) async {
    final repo = ref.watch(scheduleRepositoryProvider);
    final result = await repo.getCalendarData(params.year, params.month);
    return result.fold(
      (failure) => throw Exception(failure.message),
      (schedules) => schedules,
    );
  },
);
