// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Property _$PropertyFromJson(Map<String, dynamic> json) => Property(
  id: json['_id'] as String,
  name: json['name'] as String,
  type: json['type'] as String,
  address: PropertyAddress.fromJson(json['address'] as Map<String, dynamic>),
  totalFloors: (json['totalFloors'] as num).toInt(),
  totalUnits: (json['totalUnits'] as num).toInt(),
  amenities:
      (json['amenities'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  description: json['description'] as String?,
  images:
      (json['images'] as List<dynamic>?)
          ?.map((e) => PropertyImage.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  isListed: json['isListed'] as bool? ?? true,
  owner: json['owner'] as String?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$PropertyToJson(Property instance) => <String, dynamic>{
  '_id': instance.id,
  'name': instance.name,
  'type': instance.type,
  'address': instance.address,
  'totalFloors': instance.totalFloors,
  'totalUnits': instance.totalUnits,
  'amenities': instance.amenities,
  'description': instance.description,
  'images': instance.images,
  'isListed': instance.isListed,
  'owner': instance.owner,
  'createdAt': instance.createdAt?.toIso8601String(),
};

PropertyAddress _$PropertyAddressFromJson(Map<String, dynamic> json) =>
    PropertyAddress(
      street: json['street'] as String?,
      city: json['city'] as String?,
      subCity: json['subCity'] as String?,
      woreda: json['woreda'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
    );

Map<String, dynamic> _$PropertyAddressToJson(PropertyAddress instance) =>
    <String, dynamic>{
      'street': instance.street,
      'city': instance.city,
      'subCity': instance.subCity,
      'woreda': instance.woreda,
      'state': instance.state,
      'country': instance.country,
    };

PropertyImage _$PropertyImageFromJson(Map<String, dynamic> json) =>
    PropertyImage(
      url: json['url'] as String,
      publicId: json['publicId'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
    );

Map<String, dynamic> _$PropertyImageToJson(PropertyImage instance) =>
    <String, dynamic>{
      'url': instance.url,
      'publicId': instance.publicId,
      'isPrimary': instance.isPrimary,
    };

Unit _$UnitFromJson(Map<String, dynamic> json) => Unit(
  id: json['_id'] as String,
  unitNumber: json['unitNumber'] as String,
  type: json['type'] as String,
  floor: (json['floor'] as num).toInt(),
  size: json['size'] as num,
  status: json['status'] as String? ?? 'vacant',
  pricing: json['pricing'] == null
      ? null
      : UnitPricing.fromJson(json['pricing'] as Map<String, dynamic>),
  features:
      (json['features'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  images:
      (json['images'] as List<dynamic>?)
          ?.map((e) => PropertyImage.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
);

Map<String, dynamic> _$UnitToJson(Unit instance) => <String, dynamic>{
  '_id': instance.id,
  'unitNumber': instance.unitNumber,
  'type': instance.type,
  'floor': instance.floor,
  'size': instance.size,
  'status': instance.status,
  'pricing': instance.pricing,
  'features': instance.features,
  'images': instance.images,
};

UnitPricing _$UnitPricingFromJson(Map<String, dynamic> json) => UnitPricing(
  basePrice: json['basePrice'] as num?,
  amenityCharges: json['amenityCharges'] as num?,
);

Map<String, dynamic> _$UnitPricingToJson(UnitPricing instance) =>
    <String, dynamic>{
      'basePrice': instance.basePrice,
      'amenityCharges': instance.amenityCharges,
    };
