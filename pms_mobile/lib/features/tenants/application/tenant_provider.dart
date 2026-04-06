import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/tenant.dart';
import '../domain/tenant_repository.dart';
import '../infrastructure/tenant_remote_data_source.dart';
import '../infrastructure/tenant_repository_impl.dart';

final tenantRepositoryProvider = Provider<TenantRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return TenantRepositoryImpl(TenantRemoteDataSource(dio));
});

final tenantListProvider =
    AsyncNotifierProvider<TenantListNotifier, PaginatedTenants>(
        TenantListNotifier.new);

class TenantListNotifier extends AsyncNotifier<PaginatedTenants> {
  int _currentPage = 1;
  String? _statusFilter;

  @override
  Future<PaginatedTenants> build() => _fetch();

  TenantRepository get _repo => ref.read(tenantRepositoryProvider);

  Future<PaginatedTenants> _fetch() async {
    final result = await _repo.getTenants(page: _currentPage, status: _statusFilter);
    return result.fold(
      (f) => throw Exception(f.message),
      (data) => data,
    );
  }

  Future<void> refresh() async {
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> filterByStatus(String? status) async {
    _statusFilter = status;
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || _currentPage >= current.pages) return;
    _currentPage++;
    final result = await _repo.getTenants(page: _currentPage, status: _statusFilter);
    result.fold(
      (_) => _currentPage--,
      (newData) {
        state = AsyncData(PaginatedTenants(
          tenants: [...current.tenants, ...newData.tenants],
          total: newData.total,
          page: newData.page,
          pages: newData.pages,
        ));
      },
    );
  }
}

final tenantDetailProvider =
    FutureProvider.family<Tenant?, String>((ref, id) async {
  final repo = ref.read(tenantRepositoryProvider);
  final result = await repo.getTenantDetail(id);
  return result.fold(
    (f) => throw Exception(f.message),
    (tenant) => tenant,
  );
});
