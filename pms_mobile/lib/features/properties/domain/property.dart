import 'package:json_annotation/json_annotation.dart';

part 'property.g.dart';

@JsonSerializable()
class Property {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String type;
  final PropertyAddress address;
  final int totalFloors;
  final int totalUnits;
  final List<String> amenities;
  final String? description;
  final List<PropertyImage> images;
  final bool isListed;
  final String? owner;
  final DateTime? createdAt;

  const Property({
    required this.id,
    required this.name,
    required this.type,
    required this.address,
    required this.totalFloors,
    required this.totalUnits,
    this.amenities = const [],
    this.description,
    this.images = const [],
    this.isListed = true,
    this.owner,
    this.createdAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) => _$PropertyFromJson(json);
  Map<String, dynamic> toJson() => _$PropertyToJson(this);

  String get primaryImageUrl {
    final primary = images.where((img) => img.isPrimary).firstOrNull;
    return primary?.url ?? (images.isNotEmpty ? images.first.url : '');
  }

  int get occupiedUnits => 0; // Computed from units
}

@JsonSerializable()
class PropertyAddress {
  final String? street;
  final String? city;
  final String? subCity;
  final String? woreda;
  final String? state;
  final String? country;

  const PropertyAddress({
    this.street,
    this.city,
    this.subCity,
    this.woreda,
    this.state,
    this.country,
  });

  factory PropertyAddress.fromJson(Map<String, dynamic> json) =>
      _$PropertyAddressFromJson(json);
  Map<String, dynamic> toJson() => _$PropertyAddressToJson(this);

  String get displayAddress {
    final parts = [street, subCity, woreda, city, state, country]
        .where((p) => p != null && p.isNotEmpty)
        .toList();
    return parts.join(', ');
  }
}

@JsonSerializable()
class PropertyImage {
  final String url;
  final String? publicId;
  final bool isPrimary;

  const PropertyImage({
    required this.url,
    this.publicId,
    this.isPrimary = false,
  });

  factory PropertyImage.fromJson(Map<String, dynamic> json) =>
      _$PropertyImageFromJson(json);
  Map<String, dynamic> toJson() => _$PropertyImageToJson(this);
}

@JsonSerializable()
class Unit {
  @JsonKey(name: '_id')
  final String id;
  final String unitNumber;
  final String type;
  final int floor;
  final num size;
  final String status;
  final UnitPricing? pricing;
  final List<String> features;
  final List<PropertyImage> images;

  const Unit({
    required this.id,
    required this.unitNumber,
    required this.type,
    required this.floor,
    required this.size,
    this.status = 'vacant',
    this.pricing,
    this.features = const [],
    this.images = const [],
  });

  factory Unit.fromJson(Map<String, dynamic> json) => _$UnitFromJson(json);
  Map<String, dynamic> toJson() => _$UnitToJson(this);

  num get totalPrice => (pricing?.basePrice ?? 0) + (pricing?.amenityCharges ?? 0);
}

@JsonSerializable()
class UnitPricing {
  final num? basePrice;
  final num? amenityCharges;

  const UnitPricing({this.basePrice, this.amenityCharges});

  factory UnitPricing.fromJson(Map<String, dynamic> json) =>
      _$UnitPricingFromJson(json);
  Map<String, dynamic> toJson() => _$UnitPricingToJson(this);
}

class PaginatedProperties {
  final List<Property> properties;
  final int total;
  final int page;
  final int pages;

  const PaginatedProperties({
    required this.properties,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory PaginatedProperties.fromJson(Map<String, dynamic> json) {
    return PaginatedProperties(
      properties: (json['properties'] as List? ?? [])
          .map((e) => Property.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pages: json['pages'] as int? ?? 1,
    );
  }
}
