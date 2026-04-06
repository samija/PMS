import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/booking_application.dart';
import '../domain/listing.dart';
import '../domain/listing_repository.dart';
import 'listing_remote_data_source.dart';

class ListingRepositoryImpl implements ListingRepository {
  final ListingRemoteDataSource _dataSource;

  ListingRepositoryImpl(this._dataSource);

  @override
  Future<Either<Failure, PaginatedListings>> getListings({
    String? city,
    String? type,
    double? minPrice,
    double? maxPrice,
    int page = 1,
  }) async {
    try {
      return Right(await _dataSource.getListings(
        city: city,
        type: type,
        minPrice: minPrice,
        maxPrice: maxPrice,
        page: page,
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Listing>> getListingDetail(String id) async {
    try {
      return Right(await _dataSource.getListingDetail(id));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, BookingApplication>> applyForListing({
    required String listingId,
    DateTime? moveInDate,
    String? phone,
    String? message,
  }) async {
    try {
      return Right(await _dataSource.applyForListing(
        listingId: listingId,
        moveInDate: moveInDate,
        phone: phone,
        message: message,
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, List<BookingApplication>>> getMyApplications() async {
    try {
      return Right(await _dataSource.getMyApplications());
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> cancelApplication(String id) async {
    try {
      await _dataSource.cancelApplication(id);
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }
}
