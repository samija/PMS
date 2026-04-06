import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_provider.dart';
import '../../auth/application/auth_provider.dart';
import '../../auth/application/auth_state.dart';
import 'help_support_sheet.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;
    final themeMode = ref.watch(themeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // ---- Profile header ----
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor:
                      AppTheme.primaryBlue.withValues(alpha: 0.1),
                  backgroundImage: user?.avatar != null
                      ? NetworkImage(user!.avatar!)
                      : null,
                  child: user?.avatar == null
                      ? Text(
                          (user != null && user.name.isNotEmpty)
                              ? user.name[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryBlue,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'User',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        user?.email ?? '',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color:
                              AppTheme.primaryBlue.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          user?.role.toUpperCase() ?? 'USER',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryBlue,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // ---- Account section ----
          _SectionHeader(title: 'Account'),
          _SettingsTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            onTap: () => context.push('/settings/profile'),
          ),
          _SettingsTile(
            icon: Icons.payment_outlined,
            title: 'My Payments',
            onTap: () => context.push('/payments'),
          ),
          _SettingsTile(
            icon: Icons.build_outlined,
            title: 'Maintenance',
            onTap: () => context.push('/maintenance'),
          ),
          _SettingsTile(
            icon: Icons.apartment_outlined,
            title: 'Browse Listings',
            onTap: () => context.push('/listings'),
          ),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: 'My Applications',
            onTap: () => context.push('/my-applications'),
          ),
          const Divider(height: 1),

          // ---- Preferences section ----
          _SectionHeader(title: 'Preferences'),
          _SettingsTile(
            icon: Icons.dark_mode_outlined,
            title: 'Dark Mode',
            subtitle: switch (themeMode) {
              ThemeMode.light => 'Light',
              ThemeMode.dark => 'Dark',
              ThemeMode.system => 'System',
            },
            trailing: Switch(
              value: themeMode == ThemeMode.dark,
              activeColor: AppTheme.primaryBlue,
              onChanged: (_) =>
                  ref.read(themeProvider.notifier).toggleTheme(),
            ),
          ),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            onTap: () => context.push('/notifications'),
          ),
          const Divider(height: 1),

          // ---- Support section ----
          _SectionHeader(title: 'Support'),
          _SettingsTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            onTap: () => HelpSupportSheet.show(context),
          ),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'About',
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: 'Enderase',
                applicationVersion: '1.0.0',
                applicationIcon: const Icon(
                  Icons.apartment,
                  size: 48,
                  color: AppTheme.primaryBlue,
                ),
                children: [
                  const Text(
                      'Property Management System - Manage your properties, tenants, and payments.'),
                ],
              );
            },
          ),
          const Divider(height: 1),

          // ---- Danger Zone ----
          _SectionHeader(title: 'Danger Zone'),
          _SettingsTile(
            icon: Icons.logout,
            title: 'Sign Out',
            color: AppTheme.errorRed,
            onTap: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Sign Out'),
                  content:
                      const Text('Are you sure you want to sign out?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Cancel'),
                    ),
                    FilledButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        ref.read(authProvider.notifier).logout();
                      },
                      style: FilledButton.styleFrom(
                          backgroundColor: AppTheme.errorRed),
                      child: const Text('Sign Out'),
                    ),
                  ],
                ),
              );
            },
          ),
          _SettingsTile(
            icon: Icons.delete_outline,
            title: 'Delete Account',
            color: AppTheme.errorRed,
            onTap: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Delete Account'),
                  content: const Text(
                    'To delete your account, please contact support at support@enderase.com. '
                    'This action is irreversible.',
                  ),
                  actions: [
                    FilledButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            },
          ),

          // ---- App version ----
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(
                'Enderase v1.0.0',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.gray400,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Helper widgets ----

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppTheme.gray500,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Color? color;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color ?? AppTheme.gray600),
      title: Text(title, style: TextStyle(color: color)),
      subtitle: subtitle != null
          ? Text(subtitle!, style: const TextStyle(fontSize: 12))
          : null,
      trailing: trailing ??
          (onTap != null
              ? const Icon(Icons.chevron_right, color: AppTheme.gray400)
              : null),
      onTap: onTap,
    );
  }
}
