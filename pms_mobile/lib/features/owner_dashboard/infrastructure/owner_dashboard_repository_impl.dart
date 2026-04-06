import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/owner_stats.dart';
import '../domain/owner_dashboard_repository.dart';
import 'owner_dashboard_remote_data_source.dart';

class OwnerDashboardRepositoryImpl implements OwnerDashboardRepository {
  final OwnerDashboardRemoteDataSource _remoteDataSource;

  OwnerDashboardRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, OwnerStats>> getOwnerStats() async {
    try {
      final paymentStats = await _remoteDataSource.getPaymentStats();
      final maintenanceStats = await _remoteDataSource.getMaintenanceStats();

      final stats = OwnerStats(
        totalRevenue: (paymentStats['totalRevenue'] as num?)?.toDouble() ?? 0.0,
        pendingPayments: (paymentStats['pendingPayments'] as num?)?.toInt() ?? 0,
        overduePayments: (paymentStats['overduePayments'] as num?)?.toInt() ?? 0,
        totalProperties: (paymentStats['totalProperties'] as num?)?.toInt() ?? 0,
        totalUnits: (paymentStats['totalUnits'] as num?)?.toInt() ?? 0,
        occupiedUnits: (paymentStats['occupiedUnits'] as num?)?.toInt() ?? 0,
        occupancyRate: (paymentStats['occupancyRate'] as num?)?.toDouble() ?? 0.0,
        openMaintenanceRequests: (maintenanceStats['openRequests'] as num?)?.toInt() ?? 0,
        inProgressMaintenance: (maintenanceStats['inProgress'] as num?)?.toInt() ?? 0,
        completedMaintenance: (maintenanceStats['completed'] as num?)?.toInt() ?? 0,
        totalTenants: (paymentStats['totalTenants'] as num?)?.toInt() ?? 0,
      );

      return Right(stats);
    } catch (e) {
      return handleException(e);
    }
  }
}
