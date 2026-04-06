import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/validators.dart';
import '../application/maintenance_provider.dart';

class CreateRequestScreen extends ConsumerStatefulWidget {
  const CreateRequestScreen({super.key});

  @override
  ConsumerState<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends ConsumerState<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _category = 'plumbing';
  String _priority = 'medium';
  final List<File> _images = [];
  final _picker = ImagePicker();

  static const _categories = [
    ('plumbing', Icons.plumbing, 'Plumbing'),
    ('electrical', Icons.electrical_services, 'Electrical'),
    ('appliance', Icons.kitchen, 'Appliance'),
    ('structural', Icons.foundation, 'Structural'),
    ('hvac', Icons.ac_unit, 'HVAC'),
    ('other', Icons.more_horiz, 'Other'),
  ];

  static const _priorities = [
    ('low', 'Low', AppTheme.primaryBlue),
    ('medium', 'Medium', AppTheme.warning),
    ('high', 'High', Colors.orange),
    ('emergency', 'Emergency', AppTheme.errorRed),
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final createState = ref.watch(createRequestProvider);
    final isLoading = createState is CreateRequestLoading;

    ref.listen<CreateRequestState>(createRequestProvider, (prev, next) {
      if (next is CreateRequestSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request submitted successfully!'), backgroundColor: AppTheme.primaryBlue),
        );
        ref.read(createRequestProvider.notifier).reset();
        context.go('/maintenance');
      } else if (next is CreateRequestError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message), backgroundColor: AppTheme.errorRed),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('New Request')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Title
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  hintText: 'Brief description of the issue',
                ),
                validator: (v) => Validators.required(v, 'Title'),
              ),
              const SizedBox(height: 16),

              // Category
              Text('Category', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _categories.map((c) {
                  final isSelected = _category == c.$1;
                  return FilterChip(
                    selected: isSelected,
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(c.$2, size: 16),
                        const SizedBox(width: 4),
                        Text(c.$3),
                      ],
                    ),
                    onSelected: (_) => setState(() => _category = c.$1),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Priority
              Text('Priority', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _priorities.map((p) {
                  final isSelected = _priority == p.$1;
                  return ChoiceChip(
                    selected: isSelected,
                    label: Text(p.$2),
                    selectedColor: p.$3.withValues(alpha: 0.2),
                    onSelected: (_) => setState(() => _priority = p.$1),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // Description
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  hintText: 'Describe the issue in detail',
                  alignLabelWithHint: true,
                ),
                validator: (v) => Validators.required(v, 'Description'),
              ),
              const SizedBox(height: 16),

              // Photos
              Text('Photos (optional)', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ..._images.asMap().entries.map((entry) => Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(entry.value, width: 80, height: 80, fit: BoxFit.cover),
                          ),
                          Positioned(
                            top: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: () => setState(() => _images.removeAt(entry.key)),
                              child: Container(
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      )),
                  if (_images.length < 5)
                    InkWell(
                      onTap: _pickImage,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          border: Border.all(color: Theme.of(context).colorScheme.outline),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.add_a_photo),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 24),

              // Submit
              FilledButton(
                onPressed: isLoading ? null : _handleSubmit,
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (picked != null) {
      setState(() => _images.add(File(picked.path)));
    }
  }

  void _handleSubmit() {
    if (_formKey.currentState?.validate() ?? false) {
      ref.read(createRequestProvider.notifier).create(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _category,
        priority: _priority,
        imagePaths: _images.map((f) => f.path).toList(),
      );
    }
  }
}
