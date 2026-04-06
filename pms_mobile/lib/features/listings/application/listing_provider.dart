import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/booking_application.dart';
import '../domain/listing.dart';
import '../domain/listing_repository.dart';
import '../infrastructure/listing_remote_data_source.dart';
import '../infrastructure/listing_repository_impl.dart';

final listingRepositoryProvider = Provider<ListingRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ListingRepositoryImpl(ListingRemoteDataSource(dio));
});

// ── Listings ──────────────────────────────────────────────────────────────────

final listingsProvider =
    AsyncNotifierProvider<ListingsNotifier, PaginatedListings>(
        ListingsNotifier.new);

class ListingsNotifier extends AsyncNotifier<PaginatedListings> {
  int _currentPage = 1;
  String? _city;
  String? _type;
  double? _minPrice;
  double? _maxPrice;

  @override
  Future<PaginatedListings> build() => _fetch();

  ListingRepository get _repo => ref.read(listingRepositoryProvider);

  Future<PaginatedListings> _fetch() async {
    final result = await _repo.getListings(
      city: _city,
      type: _type,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      page: _currentPage,
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

  Future<void> applyFilters({
    String? city,
    String? type,
    double? minPrice,
    double? maxPrice,
  }) async {
    _city = city;
    _type = type;
    _minPrice = minPrice;
    _maxPrice = maxPrice;
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || _currentPage >= current.pages) return;
    _currentPage++;
    final result = await _repo.getListings(
      city: _city,
      type: _type,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      page: _currentPage,
    );
    result.fold(
      (_) => _currentPage--,
      (newData) {
        state = AsyncData(PaginatedListings(
          listings: [...current.listings, ...newData.listings],
          total: newData.total,
          page: newData.page,
          pages: newData.pages,
        ));
      },
    );
  }
}

// ── Listing Detail ────────────────────────────────────────────────────────────

final listingDetailProvider =
    FutureProvider.family<Listing?, String>((ref, id) async {
  final repo = ref.read(listingRepositoryProvider);
  final result = await repo.getListingDetail(id);
  return result.fold(
    (f) => throw Exception(f.message),
    (listing) => listing,
  );
});

// ── My Applications ───────────────────────────────────────────────────────────

final myApplicationsProvider =
    AsyncNotifierProvider<MyApplicationsNotifier, List<BookingApplication>>(
        MyApplicationsNotifier.new);

class MyApplicationsNotifier extends AsyncNotifier<List<BookingApplication>> {
  @override
  Future<List<BookingApplication>> build() => _fetch();

  ListingRepository get _repo => ref.read(listingRepositoryProvider);

  Future<List<BookingApplication>> _fetch() async {
    final result = await _repo.getMyApplications();
    return result.fold(
      (f) => throw Exception(f.message),
      (data) => data,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<bool> applyForListing({
    required String listingId,
    DateTime? moveInDate,
    String? phone,
    String? message,
  }) async {
    final result = await _repo.applyForListing(
      listingId: listingId,
      moveInDate: moveInDate,
      phone: phone,
      message: message,
    );
    return result.fold(
      (_) => false,
      (_) {
        refresh();
        return true;
      },
    );
  }

  Future<bool> cancelApplication(String id) async {
    final result = await _repo.cancelApplication(id);
    return result.fold(
      (_) => false,
      (_) {
        refresh();
        return true;
      },
    );
  }
}
