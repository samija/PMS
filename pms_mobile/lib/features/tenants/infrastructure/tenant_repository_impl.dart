import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/tenant.dart';
import '../domain/tenant_repository.dart';
import 'tenant_remote_data_source.dart';

class TenantRepositoryImpl implements TenantRepository {
  final TenantRemoteDataSource _dataSource;

  TenantRepositoryImpl(this._dataSource);

  @override
  Future<Either<Failure, PaginatedTenants>> getTenants({int page = 1, String? status}) async {
    try {
      return Right(await _dataSource.getTenants(page: page, status: status));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Tenant>> getTenantDetail(String id) async {
    try {
      return Right(await _dataSource.getTenantDetail(id));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Tenant>> addTenant(Map<String, dynamic> data) async {
    try {
      return Right(await _dataSource.addTenant(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Tenant>> updateTenant(String id, Map<String, dynamic> data) async {
    try {
      return Right(await _dataSource.updateTenant(id, data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> terminateTenant(String id) async {
    try {
      await _dataSource.terminateTenant(id);
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }
}
