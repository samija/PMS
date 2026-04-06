import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../core/network/api_client.dart';
import '../domain/auth_repository.dart';
import '../infrastructure/auth_remote_data_source.dart';
import '../infrastructure/auth_repository_impl.dart';
import 'auth_state.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return AuthRepositoryImpl(
    AuthRemoteDataSource(dio),
    const FlutterSecureStorage(),
  );
});

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() {
    _tryAutoLogin();
    return const AuthInitial();
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  Future<void> _tryAutoLogin() async {
    final token = await _repo.getStoredToken();
    if (token == null) {
      state = const AuthUnauthenticated();
      return;
    }
    final result = await _repo.getProfile();
    state = result.fold(
      (failure) {
        _repo.clearToken();
        return const AuthUnauthenticated();
      },
      (user) => AuthAuthenticated(user),
    );
  }

  Future<void> login(String email, String password) async {
    state = const AuthLoading();
    final result = await _repo.login(email, password);
    state = result.fold(
      (failure) => AuthError(failure.message),
      (user) => AuthAuthenticated(user),
    );
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    state = const AuthLoading();
    final result = await _repo.register(
      email: email,
      password: password,
      name: name,
      phone: phone,
    );
    state = result.fold(
      (failure) => AuthError(failure.message),
      (user) => AuthAuthenticated(user),
    );
  }

  Future<void> googleSignIn(String idToken) async {
    state = const AuthLoading();
    final result = await _repo.googleSignIn(idToken);
    state = result.fold(
      (failure) => AuthError(failure.message),
      (user) => AuthAuthenticated(user),
    );
  }

  Future<void> logout() async {
    await _repo.clearToken();
    state = const AuthUnauthenticated();
  }

  Future<void> refreshProfile() async {
    final result = await _repo.getProfile();
    result.fold(
      (_) {},
      (user) => state = AuthAuthenticated(user),
    );
  }

  Future<bool> updateProfile({
    String? name,
    String? phone,
  }) async {
    final result = await _repo.updateProfile(name: name, phone: phone);
    return result.fold(
      (failure) => false,
      (user) {
        state = AuthAuthenticated(user);
        return true;
      },
    );
  }
}
