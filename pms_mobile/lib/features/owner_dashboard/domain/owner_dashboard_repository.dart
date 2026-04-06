import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'owner_stats.dart';

abstract class OwnerDashboardRepository {
  Future<Either<Failure, OwnerStats>> getOwnerStats();
}
