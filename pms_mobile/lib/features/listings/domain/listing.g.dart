// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'listing.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Listing _$ListingFromJson(Map<String, dynamic> json) => Listing(
  id: json['_id'] as String,
  propertyName: json['propertyName'] as String,
  unitNumber: json['unitNumber'] as String,
  unitType: json['unitType'] as String,
  floor: (json['floor'] as num).toInt(),
  size: (json['size'] as num?)?.toDouble(),
  monthlyRent: (json['monthlyRent'] as num).toDouble(),
  deposit: (json['deposit'] as num?)?.toDouble(),
  amenities:
      (json['amenities'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  images:
      (json['images'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  address: json['address'] as String?,
  city: json['city'] as String?,
  subcity: json['subcity'] as String?,
  description: json['description'] as String?,
  isAvailable: json['isAvailable'] as bool? ?? true,
  availableFrom: json['availableFrom'] == null
      ? null
      : DateTime.parse(json['availableFrom'] as String),
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$ListingToJson(Listing instance) => <String, dynamic>{
  '_id': instance.id,
  'propertyName': instance.propertyName,
  'unitNumber': instance.unitNumber,
  'unitType': instance.unitType,
  'floor': instance.floor,
  'size': instance.size,
  'monthlyRent': instance.monthlyRent,
  'deposit': instance.deposit,
  'amenities': instance.amenities,
  'images': instance.images,
  'address': instance.address,
  'city': instance.city,
  'subcity': instance.subcity,
  'description': instance.description,
  'isAvailable': instance.isAvailable,
  'availableFrom': instance.availableFrom?.toIso8601String(),
  'createdAt': instance.createdAt?.toIso8601String(),
};
