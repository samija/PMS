import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/tenancy.dart';
import '../domain/tenant_repository.dart';
import 'tenant_remote_data_source.dart';

class TenantRepositoryImpl implements TenantRepository {
  final TenantRemoteDataSource _remoteDataSource;

  TenantRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, Tenancy>> getMyTenancy() async {
    try {
      final data = await _remoteDataSource.getMyTenancy();
      return Right(Tenancy.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }
}
