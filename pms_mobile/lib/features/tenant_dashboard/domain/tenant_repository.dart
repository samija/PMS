import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'tenancy.dart';

abstract class TenantRepository {
  Future<Either<Failure, Tenancy>> getMyTenancy();
}
