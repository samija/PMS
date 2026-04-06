import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/maintenance_request.dart';
import '../domain/maintenance_repository.dart';
import '../infrastructure/maintenance_remote_data_source.dart';
import '../infrastructure/maintenance_repository_impl.dart';

final maintenanceRepositoryProvider = Provider<MaintenanceRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return MaintenanceRepositoryImpl(MaintenanceRemoteDataSource(dio));
});

final maintenanceListProvider =
    AsyncNotifierProvider<MaintenanceListNotifier, PaginatedMaintenance>(
        MaintenanceListNotifier.new);

class MaintenanceListNotifier extends AsyncNotifier<PaginatedMaintenance> {
  int _currentPage = 1;
  String? _statusFilter;
  String? _priorityFilter;

  @override
  Future<PaginatedMaintenance> build() => _fetch();

  MaintenanceRepository get _repo => ref.read(maintenanceRepositoryProvider);

  Future<PaginatedMaintenance> _fetch() async {
    final result = await _repo.getRequests(
      page: _currentPage,
      status: _statusFilter,
      priority: _priorityFilter,
    );
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

  Future<void> setFilter({String? status, String? priority}) async {
    _statusFilter = status;
    _priorityFilter = priority;
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || _currentPage >= current.pages) return;
    _currentPage++;
    final result = await _repo.getRequests(
      page: _currentPage,
      status: _statusFilter,
      priority: _priorityFilter,
    );
    result.fold(
      (_) => _currentPage--,
      (newData) {
        state = AsyncData(PaginatedMaintenance(
          requests: [...current.requests, ...newData.requests],
          total: newData.total,
          page: newData.page,
          pages: newData.pages,
        ));
      },
    );
  }
}

final maintenanceDetailProvider =
    FutureProvider.family<MaintenanceRequest?, String>((ref, id) async {
  final repo = ref.read(maintenanceRepositoryProvider);
  final result = await repo.getRequest(id);
  return result.fold(
    (f) => throw Exception(f.message),
    (request) => request,
  );
});

// Create request state
sealed class CreateRequestState {
  const CreateRequestState();
}

class CreateRequestInitial extends CreateRequestState {
  const CreateRequestInitial();
}

class CreateRequestLoading extends CreateRequestState {
  const CreateRequestLoading();
}

class CreateRequestSuccess extends CreateRequestState {
  final MaintenanceRequest request;
  const CreateRequestSuccess(this.request);
}

class CreateRequestError extends CreateRequestState {
  final String message;
  const CreateRequestError(this.message);
}

final createRequestProvider =
    NotifierProvider<CreateRequestNotifier, CreateRequestState>(CreateRequestNotifier.new);

class CreateRequestNotifier extends Notifier<CreateRequestState> {
  @override
  CreateRequestState build() => const CreateRequestInitial();

  Future<void> create({
    required String title,
    required String description,
    required String category,
    String priority = 'medium',
    List<String> imagePaths = const [],
  }) async {
    state = const CreateRequestLoading();
    final repo = ref.read(maintenanceRepositoryProvider);
    final result = await repo.createRequest(
      title: title,
      description: description,
      category: category,
      priority: priority,
      imagePaths: imagePaths,
    );
    state = result.fold(
      (f) => CreateRequestError(f.message),
      (request) => CreateRequestSuccess(request),
    );
  }

  void reset() => state = const CreateRequestInitial();
}
