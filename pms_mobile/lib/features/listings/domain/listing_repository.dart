import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'booking_application.dart';
import 'listing.dart';

abstract class ListingRepository {
  Future<Either<Failure, PaginatedListings>> getListings({
    String? city,
    String? type,
    double? minPrice,
    double? maxPrice,
    int page = 1,
  });

  Future<Either<Failure, Listing>> getListingDetail(String id);

  Future<Either<Failure, BookingApplication>> applyForListing({
    required String listingId,
    DateTime? moveInDate,
    String? phone,
    String? message,
  });

  Future<Either<Failure, List<BookingApplication>>> getMyApplications();

  Future<Either<Failure, void>> cancelApplication(String id);
}
