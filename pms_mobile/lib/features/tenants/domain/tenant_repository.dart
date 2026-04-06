import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'tenant.dart';

abstract class TenantRepository {
  Future<Either<Failure, PaginatedTenants>> getTenants({int page = 1, String? status});
  Future<Either<Failure, Tenant>> getTenantDetail(String id);
  Future<Either<Failure, Tenant>> addTenant(Map<String, dynamic> data);
  Future<Either<Failure, Tenant>> updateTenant(String id, Map<String, dynamic> data);
  Future<Either<Failure, void>> terminateTenant(String id);
}
