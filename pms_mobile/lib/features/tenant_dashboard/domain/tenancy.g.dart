// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenancy.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Tenancy _$TenancyFromJson(Map<String, dynamic> json) => Tenancy(
  id: json['_id'] as String,
  userId: json['userId'] == null
      ? null
      : TenancyUser.fromJson(json['userId'] as Map<String, dynamic>),
  propertyId: json['propertyId'] == null
      ? null
      : TenancyProperty.fromJson(json['propertyId'] as Map<String, dynamic>),
  unitId: json['unitId'] == null
      ? null
      : TenancyUnit.fromJson(json['unitId'] as Map<String, dynamic>),
  ownerId: json['ownerId'] as String?,
  leaseAgreement: json['leaseAgreement'] == null
      ? null
      : LeaseAgreement.fromJson(json['leaseAgreement'] as Map<String, dynamic>),
  emergencyContact: json['emergencyContact'] == null
      ? null
      : EmergencyContact.fromJson(
          json['emergencyContact'] as Map<String, dynamic>,
        ),
  status: json['status'] as String,
  createdAt: json['createdAt'] as String?,
);

Map<String, dynamic> _$TenancyToJson(Tenancy instance) => <String, dynamic>{
  '_id': instance.id,
  'userId': instance.userId,
  'propertyId': instance.propertyId,
  'unitId': instance.unitId,
  'ownerId': instance.ownerId,
  'leaseAgreement': instance.leaseAgreement,
  'emergencyContact': instance.emergencyContact,
  'status': instance.status,
  'createdAt': instance.createdAt,
};

TenancyUser _$TenancyUserFromJson(Map<String, dynamic> json) => TenancyUser(
  id: json['_id'] as String?,
  email: json['email'] as String?,
  name: json['name'] as String?,
);

Map<String, dynamic> _$TenancyUserToJson(TenancyUser instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'email': instance.email,
      'name': instance.name,
    };

TenancyProperty _$TenancyPropertyFromJson(Map<String, dynamic> json) =>
    TenancyProperty(
      id: json['_id'] as String?,
      name: json['name'] as String?,
      type: json['type'] as String?,
      address: json['address'] == null
          ? null
          : PropertyAddress.fromJson(json['address'] as Map<String, dynamic>),
      images: (json['images'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$TenancyPropertyToJson(TenancyProperty instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'type': instance.type,
      'address': instance.address,
      'images': instance.images,
    };

PropertyAddress _$PropertyAddressFromJson(Map<String, dynamic> json) =>
    PropertyAddress(
      street: json['street'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
    );

Map<String, dynamic> _$PropertyAddressToJson(PropertyAddress instance) =>
    <String, dynamic>{
      'street': instance.street,
      'city': instance.city,
      'state': instance.state,
      'country': instance.country,
    };

TenancyUnit _$TenancyUnitFromJson(Map<String, dynamic> json) => TenancyUnit(
  id: json['_id'] as String?,
  unitNumber: json['unitNumber'] as String?,
  floor: (json['floor'] as num?)?.toInt(),
  type: json['type'] as String?,
  size: json['size'] as num?,
  pricing: json['pricing'] == null
      ? null
      : UnitPricing.fromJson(json['pricing'] as Map<String, dynamic>),
);

Map<String, dynamic> _$TenancyUnitToJson(TenancyUnit instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'unitNumber': instance.unitNumber,
      'floor': instance.floor,
      'type': instance.type,
      'size': instance.size,
      'pricing': instance.pricing,
    };

UnitPricing _$UnitPricingFromJson(Map<String, dynamic> json) => UnitPricing(
  basePrice: json['basePrice'] as num?,
  totalPrice: json['totalPrice'] as num?,
);

Map<String, dynamic> _$UnitPricingToJson(UnitPricing instance) =>
    <String, dynamic>{
      'basePrice': instance.basePrice,
      'totalPrice': instance.totalPrice,
    };

LeaseAgreement _$LeaseAgreementFromJson(Map<String, dynamic> json) =>
    LeaseAgreement(
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
      monthlyRent: json['monthlyRent'] as num?,
      deposit: json['deposit'] as num?,
      terms: json['terms'] as String?,
    );

Map<String, dynamic> _$LeaseAgreementToJson(LeaseAgreement instance) =>
    <String, dynamic>{
      'startDate': instance.startDate,
      'endDate': instance.endDate,
      'monthlyRent': instance.monthlyRent,
      'deposit': instance.deposit,
      'terms': instance.terms,
    };

EmergencyContact _$EmergencyContactFromJson(Map<String, dynamic> json) =>
    EmergencyContact(
      name: json['name'] as String?,
      phone: json['phone'] as String?,
      relationship: json['relationship'] as String?,
    );

Map<String, dynamic> _$EmergencyContactToJson(EmergencyContact instance) =>
    <String, dynamic>{
      'name': instance.name,
      'phone': instance.phone,
      'relationship': instance.relationship,
    };
