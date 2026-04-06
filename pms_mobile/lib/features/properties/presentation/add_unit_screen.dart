import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../application/property_provider.dart';

const _unitTypes = [
  'Studio',
  '1BR',
  '2BR',
  '3BR',
  'Shop',
  'Office',
];

class AddUnitScreen extends ConsumerStatefulWidget {
  final String propertyId;

  const AddUnitScreen({super.key, required this.propertyId});

  @override
  ConsumerState<AddUnitScreen> createState() => _AddUnitScreenState();
}

class _AddUnitScreenState extends ConsumerState<AddUnitScreen> {
  final _formKey = GlobalKey<FormState>();

  final _unitNumberController = TextEditingController();
  final _floorController = TextEditingController(text: '1');
  final _sizeController = TextEditingController();
  final _rentController = TextEditingController();
  final _depositController = TextEditingController();

  String _selectedType = _unitTypes.first;
  bool _isLoading = false;

  @override
  void dispose() {
    _unitNumberController.dispose();
    _floorController.dispose();
    _sizeController.dispose();
    _rentController.dispose();
    _depositController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final repo = ref.read(propertyRepositoryProvider);
      final result = await repo.addUnit(
        propertyId: widget.propertyId,
        unitNumber: _unitNumberController.text.trim(),
        type: _selectedType.toLowerCase(),
        floor: int.tryParse(_floorController.text.trim()) ?? 1,
        size: num.tryParse(_sizeController.text.trim()) ?? 0,
        basePrice: num.tryParse(_rentController.text.trim()),
        amenityCharges: num.tryParse(_depositController.text.trim()),
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
            ref.invalidate(propertyUnitsProvider(widget.propertyId));
            ref.invalidate(propertyDetailProvider(widget.propertyId));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Unit added successfully'),
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
      appBar: AppBar(title: const Text('Add Unit')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Unit Number
              _label('Unit Number'),
              TextFormField(
                controller: _unitNumberController,
                decoration:
                    const InputDecoration(hintText: 'e.g. A-101'),
                validator: (v) =>
                    Validators.required(v, 'Unit number'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Unit Type
              _label('Unit Type'),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(),
                items: _unitTypes
                    .map(
                        (t) => DropdownMenuItem(value: t, child: Text(t)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedType = v);
                },
              ),
              const SizedBox(height: 16),

              // Floor
              _label('Floor'),
              TextFormField(
                controller: _floorController,
                decoration:
                    const InputDecoration(hintText: 'Floor number'),
                keyboardType: TextInputType.number,
                validator: (v) => Validators.required(v, 'Floor'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Size
              _label('Size (sqm)'),
              TextFormField(
                controller: _sizeController,
                decoration:
                    const InputDecoration(hintText: 'Size in square meters'),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) => Validators.required(v, 'Size'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Monthly Rent
              _label('Monthly Rent (ETB)'),
              TextFormField(
                controller: _rentController,
                decoration: const InputDecoration(
                  hintText: 'Monthly rent amount',
                  prefixText: 'ETB ',
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) =>
                    Validators.required(v, 'Monthly rent'),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 16),

              // Deposit
              _label('Deposit (ETB)'),
              TextFormField(
                controller: _depositController,
                decoration: const InputDecoration(
                  hintText: 'Deposit amount',
                  prefixText: 'ETB ',
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                textInputAction: TextInputAction.done,
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
                          'Save Unit',
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
