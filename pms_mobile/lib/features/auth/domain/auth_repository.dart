import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'user.dart';

abstract class AuthRepository {
  Future<Either<Failure, User>> login(String email, String password);
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  });
  Future<Either<Failure, User>> googleSignIn(String idToken);
  Future<Either<Failure, User>> getProfile();
  Future<Either<Failure, User>> updateProfile({String? name, String? phone});
  Future<String?> getStoredToken();
  Future<void> storeToken(String token);
  Future<void> clearToken();
}
