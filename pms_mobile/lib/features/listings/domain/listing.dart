import 'package:json_annotation/json_annotation.dart';

part 'listing.g.dart';

@JsonSerializable()
class Listing {
  @JsonKey(name: '_id')
  final String id;
  final String propertyName;
  final String unitNumber;
  final String unitType;
  final int floor;
  final double? size;
  final double monthlyRent;
  final double? deposit;
  final List<String> amenities;
  final List<String> images;
  final String? address;
  final String? city;
  final String? subcity;
  final String? description;
  final bool isAvailable;
  final DateTime? availableFrom;
  final DateTime? createdAt;

  const Listing({
    required this.id,
    required this.propertyName,
    required this.unitNumber,
    required this.unitType,
    required this.floor,
    this.size,
    required this.monthlyRent,
    this.deposit,
    this.amenities = const [],
    this.images = const [],
    this.address,
    this.city,
    this.subcity,
    this.description,
    this.isAvailable = true,
    this.availableFrom,
    this.createdAt,
  });

  factory Listing.fromJson(Map<String, dynamic> json) =>
      _$ListingFromJson(json);
  Map<String, dynamic> toJson() => _$ListingToJson(this);

  String get displayLocation {
    final parts = [subcity, city].where((p) => p != null && p.isNotEmpty).toList();
    return parts.isNotEmpty ? parts.join(', ') : address ?? 'Unknown location';
  }

  String get primaryImageUrl =>
      images.isNotEmpty ? images.first : '';
}

class PaginatedListings {
  final List<Listing> listings;
  final int total;
  final int page;
  final int pages;

  const PaginatedListings({
    required this.listings,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory PaginatedListings.fromJson(Map<String, dynamic> json) {
    return PaginatedListings(
      listings: (json['listings'] as List? ?? [])
          .map((e) => Listing.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pages: json['pages'] as int? ?? 1,
    );
  }
}
