// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Tenant _$TenantFromJson(Map<String, dynamic> json) => Tenant(
  id: json['_id'] as String,
  userId: json['userId'] as String?,
  name: json['name'] as String,
  email: json['email'] as String,
  phone: json['phone'] as String?,
  propertyId: json['propertyId'] as String?,
  propertyName: json['propertyName'] as String?,
  unitId: json['unitId'] as String?,
  unitNumber: json['unitNumber'] as String?,
  leaseStart: json['leaseStart'] == null
      ? null
      : DateTime.parse(json['leaseStart'] as String),
  leaseEnd: json['leaseEnd'] == null
      ? null
      : DateTime.parse(json['leaseEnd'] as String),
  monthlyRent: (json['monthlyRent'] as num?)?.toDouble() ?? 0,
  status: json['status'] as String? ?? 'active',
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$TenantToJson(Tenant instance) => <String, dynamic>{
  '_id': instance.id,
  'userId': instance.userId,
  'name': instance.name,
  'email': instance.email,
  'phone': instance.phone,
  'propertyId': instance.propertyId,
  'propertyName': instance.propertyName,
  'unitId': instance.unitId,
  'unitNumber': instance.unitNumber,
  'leaseStart': instance.leaseStart?.toIso8601String(),
  'leaseEnd': instance.leaseEnd?.toIso8601String(),
  'monthlyRent': instance.monthlyRent,
  'status': instance.status,
  'createdAt': instance.createdAt?.toIso8601String(),
};
