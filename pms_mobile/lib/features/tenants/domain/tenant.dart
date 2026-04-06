import 'package:json_annotation/json_annotation.dart';

part 'tenant.g.dart';

@JsonSerializable()
class Tenant {
  @JsonKey(name: '_id')
  final String id;
  final String? userId;
  final String name;
  final String email;
  final String? phone;
  final String? propertyId;
  final String? propertyName;
  final String? unitId;
  final String? unitNumber;
  final DateTime? leaseStart;
  final DateTime? leaseEnd;
  final double monthlyRent;
  final String status;
  final DateTime? createdAt;

  const Tenant({
    required this.id,
    this.userId,
    required this.name,
    required this.email,
    this.phone,
    this.propertyId,
    this.propertyName,
    this.unitId,
    this.unitNumber,
    this.leaseStart,
    this.leaseEnd,
    this.monthlyRent = 0,
    this.status = 'active',
    this.createdAt,
  });

  factory Tenant.fromJson(Map<String, dynamic> json) => _$TenantFromJson(json);
  Map<String, dynamic> toJson() => _$TenantToJson(this);

  bool get isActive => status == 'active';
  bool get isExpired => status == 'expired';
  bool get isTerminated => status == 'terminated';

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  String get displayUnit => unitNumber != null ? 'Unit $unitNumber' : 'N/A';

  String get displayProperty => propertyName ?? 'N/A';
}

class PaginatedTenants {
  final List<Tenant> tenants;
  final int total;
  final int page;
  final int pages;

  const PaginatedTenants({
    required this.tenants,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory PaginatedTenants.fromJson(Map<String, dynamic> json) {
    return PaginatedTenants(
      tenants: (json['tenants'] as List? ?? [])
          .map((e) => Tenant.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pages: json['pages'] as int? ?? 1,
    );
  }
}
