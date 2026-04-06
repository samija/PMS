import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_provider.dart';
import '../../features/auth/application/auth_state.dart';
import '../theme/app_theme.dart';

class AppShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const AppShell({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final isOwner = authState is AuthAuthenticated && authState.user.isOwner;

    final tabs = isOwner ? _ownerTabs : _tenantTabs;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: AppTheme.gray200, width: 1),
          ),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: (index) {
            navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            );
          },
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          indicatorColor: AppTheme.primaryBlue.withValues(alpha: 0.1),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: tabs
              .map(
                (tab) => NavigationDestination(
                  icon: Icon(tab.icon, color: AppTheme.gray400),
                  selectedIcon:
                      Icon(tab.activeIcon, color: AppTheme.primaryBlue),
                  label: tab.label,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

class _TabItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;

  const _TabItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });
}

const _tenantTabs = [
  _TabItem(
    label: 'Home',
    icon: Icons.home_outlined,
    activeIcon: Icons.home,
  ),
  _TabItem(
    label: 'Payments',
    icon: Icons.payment_outlined,
    activeIcon: Icons.payment,
  ),
  _TabItem(
    label: 'Listings',
    icon: Icons.apartment_outlined,
    activeIcon: Icons.apartment,
  ),
  _TabItem(
    label: 'Maintenance',
    icon: Icons.build_outlined,
    activeIcon: Icons.build,
  ),
  _TabItem(
    label: 'Settings',
    icon: Icons.settings_outlined,
    activeIcon: Icons.settings,
  ),
];

const _ownerTabs = [
  _TabItem(
    label: 'Home',
    icon: Icons.home_outlined,
    activeIcon: Icons.home,
  ),
  _TabItem(
    label: 'Properties',
    icon: Icons.apartment_outlined,
    activeIcon: Icons.apartment,
  ),
  _TabItem(
    label: 'Tenants',
    icon: Icons.people_outlined,
    activeIcon: Icons.people,
  ),
  _TabItem(
    label: 'Payments',
    icon: Icons.payment_outlined,
    activeIcon: Icons.payment,
  ),
  _TabItem(
    label: 'Settings',
    icon: Icons.settings_outlined,
    activeIcon: Icons.settings,
  ),
];
