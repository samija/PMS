import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kThemeModeKey = 'theme_mode';

final themeProvider =
    NotifierProvider<ThemeNotifier, ThemeMode>(ThemeNotifier.new);

class ThemeNotifier extends Notifier<ThemeMode> {
  static const _storage = FlutterSecureStorage();

  @override
  ThemeMode build() {
    _loadFromStorage();
    return ThemeMode.system;
  }

  Future<void> _loadFromStorage() async {
    final stored = await _storage.read(key: _kThemeModeKey);
    if (stored != null) {
      switch (stored) {
        case 'light':
          state = ThemeMode.light;
        case 'dark':
          state = ThemeMode.dark;
        default:
          state = ThemeMode.system;
      }
    }
  }

  /// Cycles light -> dark -> system -> light ...
  Future<void> toggleTheme() async {
    switch (state) {
      case ThemeMode.light:
        state = ThemeMode.dark;
      case ThemeMode.dark:
        state = ThemeMode.system;
      case ThemeMode.system:
        state = ThemeMode.light;
    }
    await _persist();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _persist();
  }

  Future<void> _persist() async {
    final value = switch (state) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await _storage.write(key: _kThemeModeKey, value: value);
  }
}
