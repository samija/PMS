import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/owner_stats.dart';
import '../domain/owner_dashboard_repository.dart';
import '../infrastructure/owner_dashboard_remote_data_source.dart';
import '../infrastructure/owner_dashboard_repository_impl.dart';

final ownerDashboardRepositoryProvider = Provider<OwnerDashboardRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return OwnerDashboardRepositoryImpl(OwnerDashboardRemoteDataSource(dio));
});

final ownerStatsProvider =
    AsyncNotifierProvider<OwnerStatsNotifier, OwnerStats>(OwnerStatsNotifier.new);

class OwnerStatsNotifier extends AsyncNotifier<OwnerStats> {
  @override
  Future<OwnerStats> build() => _fetch();

  OwnerDashboardRepository get _repo => ref.read(ownerDashboardRepositoryProvider);

  Future<OwnerStats> _fetch() async {
    final result = await _repo.getOwnerStats();
    return result.fold(
      (f) => throw Exception(f.message),
      (data) => data,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }
}
