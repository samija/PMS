import 'package:json_annotation/json_annotation.dart';

part 'owner_stats.g.dart';

@JsonSerializable()
class OwnerStats {
  final double totalRevenue;
  final int pendingPayments;
  final int overduePayments;
  final int totalProperties;
  final int totalUnits;
  final int occupiedUnits;
  final double occupancyRate;
  final int openMaintenanceRequests;
  final int inProgressMaintenance;
  final int completedMaintenance;
  final int totalTenants;

  const OwnerStats({
    required this.totalRevenue,
    required this.pendingPayments,
    required this.overduePayments,
    required this.totalProperties,
    required this.totalUnits,
    required this.occupiedUnits,
    required this.occupancyRate,
    required this.openMaintenanceRequests,
    required this.inProgressMaintenance,
    required this.completedMaintenance,
    required this.totalTenants,
  });

  factory OwnerStats.fromJson(Map<String, dynamic> json) => _$OwnerStatsFromJson(json);
  Map<String, dynamic> toJson() => _$OwnerStatsToJson(this);
}
