import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../application/property_provider.dart';

const _propertyTypes = [
  'Apartment',
  'Condominium',
  'House',
  'Commercial',
];

const _amenityOptions = [
  'Parking',
  'Generator',
  'Guard',
  'Elevator',
  'WiFi',
  'Water Tank',
];

class AddPropertyScreen extends ConsumerStatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  ConsumerState<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends ConsumerState<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _subcityController = TextEditingController();
  final _woredaController = TextEditingController();
  final _floorsController = TextEditingController(text: '1');
  final _unitsController = TextEditingController(text: '1');

  String _selectedType = _propertyTypes.first;
  final Set<String> _selectedAmenities = {};
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _streetController.dispose();
    _cityController.dispose();
    _subcityController.dispose();
    _woredaController.dispose();
    _floorsController.dispose();
    _unitsController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(propertyRepositoryProvider);
      final result = await repo.createProperty(
        name: _nameController.text.trim(),
        type: _selectedType.toLowerCase(),
        address: {
          'street': _streetController.text.trim(),
          'city': _cityController.text.trim(),
          'subCity': _subcityController.text.trim(),
          'woreda': _woredaController.text.trim(),
        },
        totalFloors: int.tryParse(_floorsController.text.trim()) ?? 1,
        totalUnits: int.tryParse(_unitsController.text.trim()) ?? 1,
        amenities: _selectedAmenities.toList(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
      );

      result.fold(
        (failure) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(failure.message),
                backgroundColor: AppTheme.errorRed,
              ),
            );
          }
        },
        (_) {
          if (mounted) {
            // Refresh property list
            ref.read(propertyListProvider.notifier).refresh();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Property created successfully'),
                backgroundColor: AppTheme.success,
              ),
            );
            Navigator.pop(context);
          }
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.errorRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Property')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Property Name
              _label('Property Name'),
              TextFormField(
                controller: _nameController,
                decoration:
                    const InputDecoration(hintText: 'Enter property name'),
                validator: (v) => Validators.required(v, 'Property name'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Description
              _label('Description'),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                    hintText: 'Enter property description'),
                maxLines: 3,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Property Type
              _label('Property Type'),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(),
                items: _propertyTypes
                    .map((t) =>
                        DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedType = v);
                },
              ),
              const SizedBox(height: 20),

              // Address section
              Text(
                'Address',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 12),

              _label('Street'),
              TextFormField(
                controller: _streetController,
                decoration:
                    const InputDecoration(hintText: 'Street address'),
                validator: (v) => Validators.required(v, 'Street'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('City'),
                        TextFormField(
                          controller: _cityController,
                          decoration:
                              const InputDecoration(hintText: 'City'),
                          validator: (v) =>
                              Validators.required(v, 'City'),
                          textInputAction: TextInputAction.next,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Subcity'),
                        TextFormField(
                          controller: _subcityController,
                          decoration:
                              const InputDecoration(hintText: 'Subcity'),
                          textInputAction: TextInputAction.next,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              _label('Woreda'),
              TextFormField(
                controller: _woredaController,
                decoration: const InputDecoration(hintText: 'Woreda'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 20),

              // Floors and Units row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Total Floors'),
                        TextFormField(
                          controller: _floorsController,
                          decoration:
                              const InputDecoration(hintText: 'Floors'),
                          keyboardType: TextInputType.number,
                          validator: (v) =>
                              Validators.required(v, 'Floors'),
                          textInputAction: TextInputAction.next,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _label('Total Units'),
                        TextFormField(
                          controller: _unitsController,
                          decoration:
                              const InputDecoration(hintText: 'Units'),
                          keyboardType: TextInputType.number,
                          validator: (v) =>
                              Validators.required(v, 'Units'),
                          textInputAction: TextInputAction.next,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Amenities
              _label('Amenities'),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _amenityOptions.map((amenity) {
                  final selected = _selectedAmenities.contains(amenity);
                  return FilterChip(
                    label: Text(amenity),
                    selected: selected,
                    selectedColor:
                        AppTheme.primaryBlue.withValues(alpha: 0.15),
                    checkmarkColor: AppTheme.primaryBlue,
                    onSelected: (val) {
                      setState(() {
                        if (val) {
                          _selectedAmenities.add(amenity);
                        } else {
                          _selectedAmenities.remove(amenity);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 32),

              // Save button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: _isLoading ? null : _save,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Save Property',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppTheme.gray700,
        ),
      ),
    );
  }
}
