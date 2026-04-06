import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/property.dart' as prop;
import '../domain/property.dart' show Property, PaginatedProperties;
import '../domain/property_repository.dart';
import '../infrastructure/property_remote_data_source.dart';
import '../infrastructure/property_repository_impl.dart';

final propertyRepositoryProvider = Provider<PropertyRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return PropertyRepositoryImpl(PropertyRemoteDataSource(dio));
});

final propertyListProvider =
    AsyncNotifierProvider<PropertyListNotifier, PaginatedProperties>(
        PropertyListNotifier.new);

class PropertyListNotifier extends AsyncNotifier<PaginatedProperties> {
  int _currentPage = 1;

  @override
  Future<PaginatedProperties> build() => _fetch();

  PropertyRepository get _repo => ref.read(propertyRepositoryProvider);

  Future<PaginatedProperties> _fetch() async {
    final result = await _repo.getProperties(page: _currentPage);
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

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || _currentPage >= current.pages) return;
    _currentPage++;
    final result = await _repo.getProperties(page: _currentPage);
    result.fold(
      (_) => _currentPage--,
      (newData) {
        state = AsyncData(PaginatedProperties(
          properties: [...current.properties, ...newData.properties],
          total: newData.total,
          page: newData.page,
          pages: newData.pages,
        ));
      },
    );
  }
}

final propertyDetailProvider =
    FutureProvider.family<Property?, String>((ref, id) async {
  final repo = ref.read(propertyRepositoryProvider);
  final result = await repo.getProperty(id);
  return result.fold(
    (f) => throw Exception(f.message),
    (property) => property,
  );
});

final propertyUnitsProvider =
    FutureProvider.family<List<prop.Unit>, String>((ref, propertyId) async {
  final repo = ref.read(propertyRepositoryProvider);
  final result = await repo.getUnits(propertyId);
  return result.fold(
    (f) => throw Exception(f.message),
    (units) => units,
  );
});

// ── Create Property ──────────────────────────────────────────────────────

final createPropertyProvider =
    AsyncNotifierProvider<CreatePropertyNotifier, void>(
        CreatePropertyNotifier.new);

class CreatePropertyNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  PropertyRepository get _repo => ref.read(propertyRepositoryProvider);

  Future<Property?> createProperty({
    required String name,
    required String type,
    required Map<String, String> address,
    required int totalFloors,
    required int totalUnits,
    List<String> amenities = const [],
    String? description,
    List<String> imagePaths = const [],
  }) async {
    state = const AsyncLoading();
    final result = await _repo.createProperty(
      name: name,
      type: type,
      address: address,
      totalFloors: totalFloors,
      totalUnits: totalUnits,
      amenities: amenities,
      description: description,
      imagePaths: imagePaths,
    );
    return result.fold(
      (f) {
        state = AsyncError(f.message, StackTrace.current);
        return null;
      },
      (property) {
        state = const AsyncData(null);
        ref.invalidate(propertyListProvider);
        return property;
      },
    );
  }
}

// ── Update Property ──────────────────────────────────────────────────────

final updatePropertyProvider =
    AsyncNotifierProvider<UpdatePropertyNotifier, void>(
        UpdatePropertyNotifier.new);

class UpdatePropertyNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  PropertyRepository get _repo => ref.read(propertyRepositoryProvider);

  Future<Property?> updateProperty(String id, Map<String, dynamic> data) async {
    state = const AsyncLoading();
    final result = await _repo.updateProperty(id, data);
    return result.fold(
      (f) {
        state = AsyncError(f.message, StackTrace.current);
        return null;
      },
      (property) {
        state = const AsyncData(null);
        ref.invalidate(propertyDetailProvider(id));
        ref.invalidate(propertyListProvider);
        return property;
      },
    );
  }
}

// ── Add Unit ─────────────────────────────────────────────────────────────

final addUnitProvider =
    AsyncNotifierProvider<AddUnitNotifier, void>(AddUnitNotifier.new);

class AddUnitNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  PropertyRepository get _repo => ref.read(propertyRepositoryProvider);

  Future<prop.Unit?> addUnit({
    required String propertyId,
    required String unitNumber,
    required String type,
    required int floor,
    required num size,
    num? basePrice,
    num? amenityCharges,
    List<String> features = const [],
    List<String> imagePaths = const [],
  }) async {
    state = const AsyncLoading();
    final result = await _repo.addUnit(
      propertyId: propertyId,
      unitNumber: unitNumber,
      type: type,
      floor: floor,
      size: size,
      basePrice: basePrice,
      amenityCharges: amenityCharges,
      features: features,
      imagePaths: imagePaths,
    );
    return result.fold(
      (f) {
        state = AsyncError(f.message, StackTrace.current);
        return null;
      },
      (unit) {
        state = const AsyncData(null);
        ref.invalidate(propertyUnitsProvider(propertyId));
        ref.invalidate(propertyDetailProvider(propertyId));
        return unit;
      },
    );
  }
}
