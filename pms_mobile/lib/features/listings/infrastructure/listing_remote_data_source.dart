import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../domain/booking_application.dart';
import '../domain/listing.dart';

class ListingRemoteDataSource {
  final Dio _dio;

  ListingRemoteDataSource(this._dio);

  Future<PaginatedListings> getListings({
    String? city,
    String? type,
    double? minPrice,
    double? maxPrice,
    int page = 1,
  }) async {
    final response = await _dio.get(
      ApiConstants.listings,
      queryParameters: {
        'page': page,
        'limit': 10,
        if (city != null && city.isNotEmpty) 'city': city,
        if (type != null && type.isNotEmpty) 'type': type,
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
      },
    );
    final data =
        response.data['data'] as Map<String, dynamic>? ?? response.data;
    return PaginatedListings.fromJson(data);
  }

  Future<Listing> getListingDetail(String id) async {
    final response = await _dio.get(ApiConstants.listing(id));
    return Listing.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<BookingApplication> applyForListing({
    required String listingId,
    DateTime? moveInDate,
    String? phone,
    String? message,
  }) async {
    final response = await _dio.post(
      ApiConstants.waitlistApply,
      data: {
        'listingId': listingId,
        if (moveInDate != null) 'moveInDate': moveInDate.toIso8601String(),
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (message != null && message.isNotEmpty) 'message': message,
      },
    );
    return BookingApplication.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<List<BookingApplication>> getMyApplications() async {
    final response = await _dio.get(ApiConstants.myApplications);
    final data = response.data['data'];
    if (data is List) {
      return data
          .map((e) => BookingApplication.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return (data['applications'] as List? ?? [])
        .map((e) => BookingApplication.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> cancelApplication(String id) async {
    await _dio.delete(ApiConstants.cancelApplication(id));
  }
}
