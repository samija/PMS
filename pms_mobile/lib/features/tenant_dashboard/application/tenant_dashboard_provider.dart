import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/tenancy.dart';
import '../domain/tenant_repository.dart';
import '../infrastructure/tenant_remote_data_source.dart';
import '../infrastructure/tenant_repository_impl.dart';

final tenantRepositoryProvider = Provider<TenantRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TenantRepositoryImpl(TenantRemoteDataSource(dio));
});

final tenancyProvider = AsyncNotifierProvider<TenancyNotifier, Tenancy?>(TenancyNotifier.new);

class TenancyNotifier extends AsyncNotifier<Tenancy?> {
  @override
  Future<Tenancy?> build() => _fetchTenancy();

  TenantRepository get _repo => ref.read(tenantRepositoryProvider);

  Future<Tenancy?> _fetchTenancy() async {
    final result = await _repo.getMyTenancy();
    return result.fold(
      (failure) => throw Exception(failure.message),
      (tenancy) => tenancy,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchTenancy);
  }
}
