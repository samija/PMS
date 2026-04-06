import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../properties/application/property_provider.dart';
import '../../properties/domain/property.dart';
import '../application/tenant_provider.dart';

class AddTenantScreen extends ConsumerStatefulWidget {
  const AddTenantScreen({super.key});

  @override
  ConsumerState<AddTenantScreen> createState() => _AddTenantScreenState();
}

class _AddTenantScreenState extends ConsumerState<AddTenantScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _rentController = TextEditingController();
  final _depositController = TextEditingController();

  String? _selectedPropertyId;
  String? _selectedUnitId;
  DateTime? _leaseStart;
  DateTime? _leaseEnd;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _rentController.dispose();
    _depositController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final propertiesAsync = ref.watch(propertyListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Tenant'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildSectionLabel(context, 'Personal Information'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                hintText: 'Enter tenant email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Email is required';
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v)) {
                  return 'Enter a valid email';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Full Name',
                hintText: 'Enter tenant name',
                prefixIcon: Icon(Icons.person_outlined),
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                hintText: 'Enter phone number',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 24),
            _buildSectionLabel(context, 'Property & Unit'),
            const SizedBox(height: 8),
            propertiesAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const Text('Failed to load properties'),
              data: (paginated) => _buildPropertyDropdown(paginated.properties),
            ),
            const SizedBox(height: 12),
            _buildUnitDropdown(),
            const SizedBox(height: 24),
            _buildSectionLabel(context, 'Lease Details'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _rentController,
              decoration: const InputDecoration(
                labelText: 'Monthly Rent (ETB)',
                hintText: 'Enter monthly rent',
                prefixIcon: Icon(Icons.payments_outlined),
              ),
              keyboardType: TextInputType.number,
              validator: (v) {
                if (v == null || v.isEmpty) return 'Monthly rent is required';
                if (double.tryParse(v) == null) return 'Enter a valid number';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _depositController,
              decoration: const InputDecoration(
                labelText: 'Security Deposit (ETB)',
                hintText: 'Enter security deposit',
                prefixIcon: Icon(Icons.account_balance_wallet_outlined),
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            _buildDatePicker(
              context: context,
              label: 'Lease Start Date',
              selectedDate: _leaseStart,
              onDateSelected: (date) => setState(() => _leaseStart = date),
            ),
            const SizedBox(height: 12),
            _buildDatePicker(
              context: context,
              label: 'Lease End Date',
              selectedDate: _leaseEnd,
              onDateSelected: (date) => setState(() => _leaseEnd = date),
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: _isLoading ? null : _handleSubmit,
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Save Tenant'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(BuildContext context, String label) {
    return Text(
      label,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppTheme.gray700,
          ),
    );
  }

  Widget _buildPropertyDropdown(List<Property> properties) {
    return DropdownButtonFormField<String>(
      value: _selectedPropertyId,
      decoration: const InputDecoration(
        labelText: 'Property',
        hintText: 'Select a property',
        prefixIcon: Icon(Icons.apartment),
      ),
      items: properties
          .map((p) => DropdownMenuItem(
                value: p.id,
                child: Text(p.name),
              ))
          .toList(),
      onChanged: (value) {
        setState(() {
          _selectedPropertyId = value;
          _selectedUnitId = null;
        });
        if (value != null) {
          ref.invalidate(propertyUnitsProvider(value));
        }
      },
      validator: (v) => v == null ? 'Please select a property' : null,
    );
  }

  Widget _buildUnitDropdown() {
    if (_selectedPropertyId == null) {
      return DropdownButtonFormField<String>(
        value: null,
        decoration: const InputDecoration(
          labelText: 'Unit',
          hintText: 'Select property first',
          prefixIcon: Icon(Icons.door_front_door),
        ),
        items: const [],
        onChanged: null,
      );
    }

    final unitsAsync = ref.watch(propertyUnitsProvider(_selectedPropertyId!));

    return unitsAsync.when(
      loading: () => const LinearProgressIndicator(),
      error: (_, __) => const Text('Failed to load units'),
      data: (units) {
        final vacantUnits = units.where((u) => u.status == 'vacant').toList();
        return DropdownButtonFormField<String>(
          value: _selectedUnitId,
          decoration: const InputDecoration(
            labelText: 'Unit',
            hintText: 'Select a unit',
            prefixIcon: Icon(Icons.door_front_door),
          ),
          items: vacantUnits
              .map((u) => DropdownMenuItem(
                    value: u.id,
                    child: Text('Unit ${u.unitNumber} - ${u.type}'),
                  ))
              .toList(),
          onChanged: (value) => setState(() => _selectedUnitId = value),
          validator: (v) => v == null ? 'Please select a unit' : null,
        );
      },
    );
  }

  Widget _buildDatePicker({
    required BuildContext context,
    required String label,
    required DateTime? selectedDate,
    required ValueChanged<DateTime> onDateSelected,
  }) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: selectedDate ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime(2035),
        );
        if (picked != null) {
          onDateSelected(picked);
        }
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.calendar_today),
          suffixIcon: const Icon(Icons.arrow_drop_down),
        ),
        child: Text(
          selectedDate != null ? dateFormat.format(selectedDate) : 'Select date',
          style: TextStyle(
            color: selectedDate != null ? null : AppTheme.gray400,
          ),
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final data = {
      'email': _emailController.text.trim(),
      'name': _nameController.text.trim(),
      if (_phoneController.text.trim().isNotEmpty)
        'phone': _phoneController.text.trim(),
      'propertyId': _selectedPropertyId,
      'unitId': _selectedUnitId,
      'monthlyRent': double.parse(_rentController.text.trim()),
      if (_depositController.text.trim().isNotEmpty)
        'deposit': double.parse(_depositController.text.trim()),
      if (_leaseStart != null) 'leaseStart': _leaseStart!.toIso8601String(),
      if (_leaseEnd != null) 'leaseEnd': _leaseEnd!.toIso8601String(),
    };

    final repo = ref.read(tenantRepositoryProvider);
    final result = await repo.addTenant(data);

    setState(() => _isLoading = false);

    result.fold(
      (f) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(f.message),
              backgroundColor: AppTheme.errorRed,
            ),
          );
        }
      },
      (_) {
        ref.read(tenantListProvider.notifier).refresh();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Tenant added successfully'),
              backgroundColor: AppTheme.success,
            ),
          );
          context.pop();
        }
      },
    );
  }
}
