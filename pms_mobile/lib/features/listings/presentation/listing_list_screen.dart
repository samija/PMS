import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../../../core/widgets/loading_widget.dart';
import '../../../core/widgets/error_widget.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../../auth/application/auth_provider.dart';
import '../../auth/application/auth_state.dart';
import '../application/listing_provider.dart';
import '../domain/listing.dart';

class ListingListScreen extends ConsumerStatefulWidget {
  const ListingListScreen({super.key});

  @override
  ConsumerState<ListingListScreen> createState() => _ListingListScreenState();
}

class _ListingListScreenState extends ConsumerState<ListingListScreen> {
  final _searchController = TextEditingController();

  // Filter state
  String? _selectedCity;
  String? _selectedType;
  double? _minPrice;
  double? _maxPrice;

  static const _cities = [
    'Addis Ababa',
    'Dire Dawa',
    'Hawassa',
    'Bahir Dar',
    'Adama',
    'Mekelle',
    'Jimma',
  ];

  static const _unitTypes = [
    'Studio',
    'Apartment',
    '1 Bedroom',
    '2 Bedroom',
    '3 Bedroom',
    'Penthouse',
    'Commercial',
    'Office',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showFilterSheet() {
    String? tempCity = _selectedCity;
    String? tempType = _selectedType;
    final minCtrl = TextEditingController(
        text: _minPrice != null ? _minPrice!.toStringAsFixed(0) : '');
    final maxCtrl = TextEditingController(
        text: _maxPrice != null ? _maxPrice!.toStringAsFixed(0) : '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Filter Listings',
                      style: Theme.of(ctx)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    TextButton(
                      onPressed: () {
                        setModalState(() {
                          tempCity = null;
                          tempType = null;
                          minCtrl.clear();
                          maxCtrl.clear();
                        });
                      },
                      child: const Text('Reset'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // City
                Text(
                  'City',
                  style: Theme.of(ctx)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _cities.map((city) {
                    final selected = tempCity == city;
                    return ChoiceChip(
                      label: Text(city),
                      selected: selected,
                      selectedColor: AppTheme.primaryBlue.withValues(alpha: 0.15),
                      labelStyle: TextStyle(
                        color: selected ? AppTheme.primaryBlue : AppTheme.gray700,
                        fontWeight:
                            selected ? FontWeight.w600 : FontWeight.normal,
                      ),
                      onSelected: (val) {
                        setModalState(
                            () => tempCity = val ? city : null);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Unit Type
                Text(
                  'Unit Type',
                  style: Theme.of(ctx)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _unitTypes.map((type) {
                    final selected = tempType == type;
                    return ChoiceChip(
                      label: Text(type),
                      selected: selected,
                      selectedColor: AppTheme.primaryBlue.withValues(alpha: 0.15),
                      labelStyle: TextStyle(
                        color: selected ? AppTheme.primaryBlue : AppTheme.gray700,
                        fontWeight:
                            selected ? FontWeight.w600 : FontWeight.normal,
                      ),
                      onSelected: (val) {
                        setModalState(
                            () => tempType = val ? type : null);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Price range
                Text(
                  'Monthly Rent (ETB)',
                  style: Theme.of(ctx)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: minCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          hintText: 'Min',
                          prefixText: 'ETB ',
                        ),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text('--'),
                    ),
                    Expanded(
                      child: TextField(
                        controller: maxCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          hintText: 'Max',
                          prefixText: 'ETB ',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Apply button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      setState(() {
                        _selectedCity = tempCity;
                        _selectedType = tempType;
                        _minPrice = double.tryParse(minCtrl.text);
                        _maxPrice = double.tryParse(maxCtrl.text);
                      });
                      ref.read(listingsProvider.notifier).applyFilters(
                            city: tempCity,
                            type: tempType,
                            minPrice: double.tryParse(minCtrl.text),
                            maxPrice: double.tryParse(maxCtrl.text),
                          );
                      Navigator.pop(ctx);
                    },
                    child: const Text('Apply Filters'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  bool get _hasActiveFilters =>
      _selectedCity != null ||
      _selectedType != null ||
      _minPrice != null ||
      _maxPrice != null;

  @override
  Widget build(BuildContext context) {
    final listingsAsync = ref.watch(listingsProvider);

    final isAuthenticated = ref.watch(authProvider) is AuthAuthenticated;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse Listings'),
        actions: [
          if (isAuthenticated)
            IconButton(
              icon: const Icon(Icons.receipt_long_outlined),
              tooltip: 'My Applications',
              onPressed: () => context.push('/my-applications'),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search bar & filter
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by property name...',
                      prefixIcon:
                          const Icon(Icons.search, color: AppTheme.gray400),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 20),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {});
                              },
                            )
                          : null,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.gray200),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.gray200),
                      ),
                      filled: true,
                      fillColor: AppTheme.gray50,
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 10),
                Badge(
                  isLabelVisible: _hasActiveFilters,
                  smallSize: 8,
                  backgroundColor: AppTheme.primaryBlue,
                  child: IconButton.filledTonal(
                    onPressed: _showFilterSheet,
                    icon: const Icon(Icons.tune, size: 22),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.gray100,
                      foregroundColor: AppTheme.gray700,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Active filter chips
          if (_hasActiveFilters)
            Container(
              width: double.infinity,
              color: Colors.white,
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 10),
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  if (_selectedCity != null)
                    _FilterChip(
                      label: _selectedCity!,
                      onRemove: () {
                        setState(() => _selectedCity = null);
                        ref.read(listingsProvider.notifier).applyFilters(
                              city: null,
                              type: _selectedType,
                              minPrice: _minPrice,
                              maxPrice: _maxPrice,
                            );
                      },
                    ),
                  if (_selectedType != null)
                    _FilterChip(
                      label: _selectedType!,
                      onRemove: () {
                        setState(() => _selectedType = null);
                        ref.read(listingsProvider.notifier).applyFilters(
                              city: _selectedCity,
                              type: null,
                              minPrice: _minPrice,
                              maxPrice: _maxPrice,
                            );
                      },
                    ),
                  if (_minPrice != null || _maxPrice != null)
                    _FilterChip(
                      label:
                          '${_minPrice != null ? EtbFormatter.formatCompact(_minPrice!) : "0"} - ${_maxPrice != null ? EtbFormatter.formatCompact(_maxPrice!) : "Any"}',
                      onRemove: () {
                        setState(() {
                          _minPrice = null;
                          _maxPrice = null;
                        });
                        ref.read(listingsProvider.notifier).applyFilters(
                              city: _selectedCity,
                              type: _selectedType,
                              minPrice: null,
                              maxPrice: null,
                            );
                      },
                    ),
                ],
              ),
            ),

          const Divider(height: 1),

          // Listings list
          Expanded(
            child: listingsAsync.when(
              loading: () => const LoadingWidget(),
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.read(listingsProvider.notifier).refresh(),
              ),
              data: (paginated) {
                // Client-side search filter
                var listings = paginated.listings;
                final query = _searchController.text.trim().toLowerCase();
                if (query.isNotEmpty) {
                  listings = listings
                      .where((l) =>
                          l.propertyName.toLowerCase().contains(query) ||
                          (l.address ?? '').toLowerCase().contains(query))
                      .toList();
                }

                if (listings.isEmpty) {
                  return const EmptyStateWidget(
                    icon: Icons.home_work_outlined,
                    title: 'No Listings Found',
                    subtitle:
                        'Try adjusting your filters or check back later',
                  );
                }

                return NotificationListener<ScrollEndNotification>(
                  onNotification: (_) {
                    ref.read(listingsProvider.notifier).loadMore();
                    return false;
                  },
                  child: RefreshIndicator(
                    onRefresh: () =>
                        ref.read(listingsProvider.notifier).refresh(),
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: listings.length,
                      itemBuilder: (context, index) =>
                          _ListingCard(listing: listings[index]),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ── Listing Card ──────────────────────────────────────────────────────────────

class _ListingCard extends StatelessWidget {
  final Listing listing;
  const _ListingCard({required this.listing});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/listings/${listing.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Stack(
              children: [
                listing.primaryImageUrl.isNotEmpty
                    ? Image.network(
                        listing.primaryImageUrl,
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            _buildImagePlaceholder(),
                      )
                    : _buildImagePlaceholder(),
                // Available badge
                if (listing.isAvailable)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.success,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Available',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                // Unit type badge
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      listing.unitType,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Property name
                  Text(
                    listing.propertyName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Unit info
                  Text(
                    'Unit ${listing.unitNumber} - Floor ${listing.floor}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.gray500,
                        ),
                  ),
                  const SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 16, color: AppTheme.gray400),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          listing.displayLocation,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.gray500,
                                  ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Price
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        EtbFormatter.format(listing.monthlyRent),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: AppTheme.primaryBlue,
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      Text(
                        '/month',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.gray400,
                            ),
                      ),
                    ],
                  ),

                  // Size if available
                  if (listing.size != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.square_foot,
                            size: 16, color: AppTheme.gray400),
                        const SizedBox(width: 4),
                        Text(
                          '${listing.size!.toStringAsFixed(0)} sqm',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.gray500,
                                  ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primaryBlue.withValues(alpha: 0.08),
            AppTheme.primaryBlue.withValues(alpha: 0.18),
          ],
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.home_work_outlined,
          size: 56,
          color: AppTheme.primaryBlue,
        ),
      ),
    );
  }
}

// ── Filter Chip ───────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;
  const _FilterChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      deleteIcon: const Icon(Icons.close, size: 16),
      onDeleted: onRemove,
      backgroundColor: AppTheme.primaryBlue.withValues(alpha: 0.08),
      labelStyle: const TextStyle(
        color: AppTheme.primaryBlue,
        fontWeight: FontWeight.w500,
      ),
      deleteIconColor: AppTheme.primaryBlue,
      visualDensity: VisualDensity.compact,
    );
  }
}
