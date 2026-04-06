import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/etb_formatter.dart';
import '../application/payment_provider.dart';

class BankTransferScreen extends ConsumerStatefulWidget {
  final String tenantId;
  final num amount;
  final int month;
  final int year;

  const BankTransferScreen({
    super.key,
    required this.tenantId,
    required this.amount,
    required this.month,
    required this.year,
  });

  @override
  ConsumerState<BankTransferScreen> createState() => _BankTransferScreenState();
}

class _BankTransferScreenState extends ConsumerState<BankTransferScreen> {
  File? _receiptImage;
  final _picker = ImagePicker();

  @override
  Widget build(BuildContext context) {
    final payRentState = ref.watch(payRentProvider);
    final isLoading = payRentState is PayRentLoading;

    ref.listen<PayRentState>(payRentProvider, (prev, next) {
      if (next is PayRentSuccess) {
        context.go('/payments/result', extra: next.payment);
      } else if (next is PayRentError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message), backgroundColor: AppTheme.errorRed),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Bank Transfer')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Amount
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text('Transfer Amount', style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 8),
                  Text(
                    EtbFormatter.format(widget.amount),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Instructions
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Instructions', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  _InstructionStep(number: '1', text: 'Transfer the amount to the owner\'s bank account'),
                  _InstructionStep(number: '2', text: 'Take a photo or screenshot of the transfer receipt'),
                  _InstructionStep(number: '3', text: 'Upload the receipt below'),
                  _InstructionStep(number: '4', text: 'Wait for owner approval'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Receipt upload
          Text('Upload Receipt', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),

          if (_receiptImage != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(_receiptImage!, height: 200, fit: BoxFit.cover),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.refresh),
              label: const Text('Change Image'),
            ),
          ] else
            InkWell(
              onTap: _pickImage,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                height: 150,
                decoration: BoxDecoration(
                  border: Border.all(color: Theme.of(context).colorScheme.outline),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.upload_file, size: 40, color: Theme.of(context).colorScheme.outline),
                    const SizedBox(height: 8),
                    Text('Tap to upload receipt', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 24),

          // Submit
          FilledButton(
            onPressed: isLoading || _receiptImage == null ? null : _handleSubmit,
            child: isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Submit Bank Transfer'),
          ),
        ],
      ),
    );
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (picked != null) {
      setState(() => _receiptImage = File(picked.path));
    }
  }

  void _handleSubmit() {
    ref.read(payRentProvider.notifier).submitBankTransfer(
      tenantId: widget.tenantId,
      amount: widget.amount,
      type: 'rent',
      month: widget.month,
      year: widget.year,
      receiptPath: _receiptImage!.path,
    );
  }
}

class _InstructionStep extends StatelessWidget {
  final String number;
  final String text;
  const _InstructionStep({required this.number, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Text(number, style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
              color: AppTheme.primaryBlue,
            )),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}
