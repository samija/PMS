import 'package:dartz/dartz.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/auth_repository.dart';
import '../domain/user.dart';
import 'auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final FlutterSecureStorage _storage;

  AuthRepositoryImpl(this._remoteDataSource, this._storage);

  @override
  Future<Either<Failure, User>> login(String email, String password) async {
    try {
      final data = await _remoteDataSource.login(email, password);
      final user = User.fromJson(data['user']);
      await storeToken(data['token']);
      return Right(user);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      final data = await _remoteDataSource.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      final user = User.fromJson(data['user']);
      await storeToken(data['token']);
      return Right(user);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, User>> googleSignIn(String idToken) async {
    try {
      final data = await _remoteDataSource.googleSignIn(idToken);
      final user = User.fromJson(data['user']);
      await storeToken(data['token']);
      return Right(user);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, User>> getProfile() async {
    try {
      final data = await _remoteDataSource.getProfile();
      return Right(User.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, User>> updateProfile({String? name, String? phone}) async {
    try {
      final data = await _remoteDataSource.updateProfile(name: name, phone: phone);
      return Right(User.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<String?> getStoredToken() => _storage.read(key: 'auth_token');

  @override
  Future<void> storeToken(String token) => _storage.write(key: 'auth_token', value: token);

  @override
  Future<void> clearToken() => _storage.delete(key: 'auth_token');
}
