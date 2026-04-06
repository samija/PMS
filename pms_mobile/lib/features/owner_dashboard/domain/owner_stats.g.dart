// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'owner_stats.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

OwnerStats _$OwnerStatsFromJson(Map<String, dynamic> json) => OwnerStats(
  totalRevenue: (json['totalRevenue'] as num).toDouble(),
  pendingPayments: (json['pendingPayments'] as num).toInt(),
  overduePayments: (json['overduePayments'] as num).toInt(),
  totalProperties: (json['totalProperties'] as num).toInt(),
  totalUnits: (json['totalUnits'] as num).toInt(),
  occupiedUnits: (json['occupiedUnits'] as num).toInt(),
  occupancyRate: (json['occupancyRate'] as num).toDouble(),
  openMaintenanceRequests: (json['openMaintenanceRequests'] as num).toInt(),
  inProgressMaintenance: (json['inProgressMaintenance'] as num).toInt(),
  completedMaintenance: (json['completedMaintenance'] as num).toInt(),
  totalTenants: (json['totalTenants'] as num).toInt(),
);

Map<String, dynamic> _$OwnerStatsToJson(OwnerStats instance) =>
    <String, dynamic>{
      'totalRevenue': instance.totalRevenue,
      'pendingPayments': instance.pendingPayments,
      'overduePayments': instance.overduePayments,
      'totalProperties': instance.totalProperties,
      'totalUnits': instance.totalUnits,
      'occupiedUnits': instance.occupiedUnits,
      'occupancyRate': instance.occupancyRate,
      'openMaintenanceRequests': instance.openMaintenanceRequests,
      'inProgressMaintenance': instance.inProgressMaintenance,
      'completedMaintenance': instance.completedMaintenance,
      'totalTenants': instance.totalTenants,
    };
