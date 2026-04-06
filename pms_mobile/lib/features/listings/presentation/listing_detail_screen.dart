import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../auth/application/auth_provider.dart';
import '../../auth/application/auth_state.dart';
import '../application/listing_provider.dart';
import '../domain/listing.dart';

class ListingDetailScreen extends ConsumerWidget {
  final String listingId;
  const ListingDetailScreen({super.key, required this.listingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listingAsync = ref.watch(listingDetailProvider(listingId));

    return Scaffold(
      body: listingAsync.when(
        loading: () => const Scaffold(body: LoadingWidget()),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.invalidate(listingDetailProvider(listingId)),
          ),
        ),
        data: (listing) {
          if (listing == null) {
            return Scaffold(
              appBar: AppBar(),
              body: const Center(child: Text('Listing not found')),
            );
          }
          return _DetailContent(listing: listing);
        },
      ),
    );
  }
}

class _DetailContent extends StatelessWidget {
  final Listing listing;
  const _DetailContent({required this.listing});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // ── Image Area ──────────────────────────────────────────────────
        SliverAppBar(
          expandedHeight: 280,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: listing.primaryImageUrl.isNotEmpty
                ? Image.network(
                    listing.primaryImageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _buildImagePlaceholder(),
                  )
                : _buildImagePlaceholder(),
          ),
          actions: [
            Container(
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.share, color: Colors.white),
                onPressed: () {},
              ),
            ),
          ],
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Property Info Card ─────────────────────────────────
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                listing.propertyName,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ),
                            if (listing.isAvailable)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.successLight,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'Available',
                                  style: TextStyle(
                                    color: AppTheme.success,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined,
                                size: 18, color: AppTheme.gray500),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                listing.displayLocation,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(color: AppTheme.gray500),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _InfoTile(
                              icon: Icons.door_front_door_outlined,
                              label: 'Unit',
                              value: listing.unitNumber,
                            ),
                            _InfoTile(
                              icon: Icons.category_outlined,
                              label: 'Type',
                              value: listing.unitType,
                            ),
                            _InfoTile(
                              icon: Icons.layers_outlined,
                              label: 'Floor',
                              value: listing.floor.toString(),
                            ),
                            if (listing.size != null)
                              _InfoTile(
                                icon: Icons.square_foot,
                                label: 'Size',
                                value: '${listing.size!.toStringAsFixed(0)} sqm',
                              ),
                          ],
                        ),
                        if (listing.availableFrom != null) ...[
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.calendar_today,
                                  size: 16, color: AppTheme.gray500),
                              const SizedBox(width: 6),
                              Text(
                                'Available from ${DateFormat('MMM dd, yyyy').format(listing.availableFrom!)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: AppTheme.gray500),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // ── Price Card ──────────────────────────────────────────
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pricing',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Monthly Rent',
                                  style: TextStyle(
                                    color: AppTheme.gray500,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  EtbFormatter.format(listing.monthlyRent),
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(
                                        color: AppTheme.primaryBlue,
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ],
                            ),
                            if (listing.deposit != null)
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text(
                                    'Deposit',
                                    style: TextStyle(
                                      color: AppTheme.gray500,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    EtbFormatter.format(listing.deposit!),
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleLarge
                                        ?.copyWith(
                                          color: AppTheme.gray700,
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // ── Amenities ───────────────────────────────────────────
                if (listing.amenities.isNotEmpty) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Amenities',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: listing.amenities.map((amenity) {
                              return Chip(
                                avatar: Icon(
                                  _amenityIcon(amenity),
                                  size: 18,
                                  color: AppTheme.primaryBlue,
                                ),
                                label: Text(amenity),
                                backgroundColor:
                                    AppTheme.primaryBlue.withValues(alpha: 0.06),
                                labelStyle: const TextStyle(
                                  color: AppTheme.gray700,
                                  fontSize: 13,
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Description ─────────────────────────────────────────
                if (listing.description != null &&
                    listing.description!.isNotEmpty) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Description',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            listing.description!,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppTheme.gray600,
                                  height: 1.5,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Bottom padding for the button
                const SizedBox(height: 70),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: double.infinity,
      color: AppTheme.primaryBlue.withValues(alpha: 0.1),
      child: const Center(
        child: Icon(
          Icons.home_work_outlined,
          size: 64,
          color: AppTheme.primaryBlue,
        ),
      ),
    );
  }

  IconData _amenityIcon(String amenity) {
    final lower = amenity.toLowerCase();
    if (lower.contains('parking')) return Icons.local_parking;
    if (lower.contains('gym') || lower.contains('fitness')) {
      return Icons.fitness_center;
    }
    if (lower.contains('pool') || lower.contains('swim')) return Icons.pool;
    if (lower.contains('wifi') || lower.contains('internet')) return Icons.wifi;
    if (lower.contains('security') || lower.contains('guard')) {
      return Icons.security;
    }
    if (lower.contains('elevator') || lower.contains('lift')) {
      return Icons.elevator;
    }
    if (lower.contains('garden') || lower.contains('green')) {
      return Icons.park;
    }
    if (lower.contains('laundry')) return Icons.local_laundry_service;
    if (lower.contains('generator') || lower.contains('power')) {
      return Icons.bolt;
    }
    if (lower.contains('water')) return Icons.water_drop;
    return Icons.check_circle_outline;
  }
}

// ── Info Tile ─────────────────────────────────────────────────────────────────

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 22, color: AppTheme.primaryBlue),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppTheme.gray400, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ── Bottom Apply Button (used as bottomNavigationBar or floatingActionButton) ─

class ListingDetailBottomBar extends ConsumerWidget {
  final String listingId;
  const ListingDetailBottomBar({super.key, required this.listingId});

  void _promptLogin(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Login Required'),
        content: const Text(
            'You need to log in before applying for a listing.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.go('/login');
            },
            child: const Text('Log In'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAuthenticated = ref.watch(authProvider) is AuthAuthenticated;

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: isAuthenticated
              ? () => context.push('/listings/$listingId/apply')
              : () => _promptLogin(context),
          icon: const Icon(Icons.send),
          label: const Text(
            'Apply to Rent',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
      ),
    );
  }
}
