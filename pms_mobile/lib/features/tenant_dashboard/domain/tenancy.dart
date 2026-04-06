import 'package:json_annotation/json_annotation.dart';

part 'tenancy.g.dart';

@JsonSerializable()
class Tenancy {
  @JsonKey(name: '_id')
  final String id;
  final TenancyUser? userId;
  final TenancyProperty? propertyId;
  final TenancyUnit? unitId;
  final String? ownerId;
  final LeaseAgreement? leaseAgreement;
  final EmergencyContact? emergencyContact;
  final String status;
  final String? createdAt;

  const Tenancy({
    required this.id,
    this.userId,
    this.propertyId,
    this.unitId,
    this.ownerId,
    this.leaseAgreement,
    this.emergencyContact,
    required this.status,
    this.createdAt,
  });

  factory Tenancy.fromJson(Map<String, dynamic> json) => _$TenancyFromJson(json);
  Map<String, dynamic> toJson() => _$TenancyToJson(this);

  bool get isActive => status == 'active';
  bool get isLeaseExpiringSoon {
    if (leaseAgreement?.endDate == null) return false;
    final end = DateTime.parse(leaseAgreement!.endDate!);
    final daysLeft = end.difference(DateTime.now()).inDays;
    return daysLeft <= 30 && daysLeft > 0;
  }

  int get daysUntilLeaseEnd {
    if (leaseAgreement?.endDate == null) return 0;
    return DateTime.parse(leaseAgreement!.endDate!).difference(DateTime.now()).inDays;
  }
}

@JsonSerializable()
class TenancyUser {
  @JsonKey(name: '_id')
  final String? id;
  final String? email;
  final String? name;

  const TenancyUser({this.id, this.email, this.name});

  factory TenancyUser.fromJson(Map<String, dynamic> json) => _$TenancyUserFromJson(json);
  Map<String, dynamic> toJson() => _$TenancyUserToJson(this);
}

@JsonSerializable()
class TenancyProperty {
  @JsonKey(name: '_id')
  final String? id;
  final String? name;
  final String? type;
  final PropertyAddress? address;
  final List<String>? images;

  const TenancyProperty({this.id, this.name, this.type, this.address, this.images});

  factory TenancyProperty.fromJson(Map<String, dynamic> json) => _$TenancyPropertyFromJson(json);
  Map<String, dynamic> toJson() => _$TenancyPropertyToJson(this);
}

@JsonSerializable()
class PropertyAddress {
  final String? street;
  final String? city;
  final String? state;
  final String? country;

  const PropertyAddress({this.street, this.city, this.state, this.country});

  factory PropertyAddress.fromJson(Map<String, dynamic> json) => _$PropertyAddressFromJson(json);
  Map<String, dynamic> toJson() => _$PropertyAddressToJson(this);

  String get formatted => [street, city, state].where((s) => s != null && s.isNotEmpty).join(', ');
}

@JsonSerializable()
class TenancyUnit {
  @JsonKey(name: '_id')
  final String? id;
  final String? unitNumber;
  final int? floor;
  final String? type;
  final num? size;
  final UnitPricing? pricing;

  const TenancyUnit({this.id, this.unitNumber, this.floor, this.type, this.size, this.pricing});

  factory TenancyUnit.fromJson(Map<String, dynamic> json) => _$TenancyUnitFromJson(json);
  Map<String, dynamic> toJson() => _$TenancyUnitToJson(this);
}

@JsonSerializable()
class UnitPricing {
  final num? basePrice;
  final num? totalPrice;

  const UnitPricing({this.basePrice, this.totalPrice});

  factory UnitPricing.fromJson(Map<String, dynamic> json) => _$UnitPricingFromJson(json);
  Map<String, dynamic> toJson() => _$UnitPricingToJson(this);
}

@JsonSerializable()
class LeaseAgreement {
  final String? startDate;
  final String? endDate;
  final num? monthlyRent;
  final num? deposit;
  final String? terms;

  const LeaseAgreement({this.startDate, this.endDate, this.monthlyRent, this.deposit, this.terms});

  factory LeaseAgreement.fromJson(Map<String, dynamic> json) => _$LeaseAgreementFromJson(json);
  Map<String, dynamic> toJson() => _$LeaseAgreementToJson(this);
}

@JsonSerializable()
class EmergencyContact {
  final String? name;
  final String? phone;
  final String? relationship;

  const EmergencyContact({this.name, this.phone, this.relationship});

  factory EmergencyContact.fromJson(Map<String, dynamic> json) => _$EmergencyContactFromJson(json);
  Map<String, dynamic> toJson() => _$EmergencyContactToJson(this);
}
