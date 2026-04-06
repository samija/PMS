import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class HelpSupportSheet extends StatelessWidget {
  const HelpSupportSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => const HelpSupportSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppTheme.gray300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            Text(
              'Help & Support',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.gray900,
                  ),
            ),
            const SizedBox(height: 20),

            // Email row
            _ContactRow(
              icon: Icons.mail_outline,
              iconColor: AppTheme.primaryBlue,
              title: 'Email Us',
              subtitle: 'support@enderase.com',
              onTap: () {
                // Could launch mailto
              },
            ),
            const Divider(height: 1),

            // Phone row
            _ContactRow(
              icon: Icons.phone_outlined,
              iconColor: AppTheme.success,
              title: 'Call Us',
              subtitle: '+251-111-234567',
              onTap: () {
                // Could launch tel
              },
            ),
            const Divider(height: 1),

            // FAQ placeholder
            _ContactRow(
              icon: Icons.help_outline,
              iconColor: AppTheme.warning,
              title: 'FAQ',
              subtitle: 'Frequently Asked Questions',
              onTap: () {
                // FAQ navigation placeholder
              },
            ),

            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const _ContactRow({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppTheme.gray800,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          fontSize: 13,
          color: AppTheme.gray500,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppTheme.gray400),
      onTap: onTap,
    );
  }
}
