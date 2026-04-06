import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../application/payment_provider.dart';

class PaymentWebViewScreen extends ConsumerStatefulWidget {
  final String checkoutUrl;
  final String txRef;

  const PaymentWebViewScreen({
    super.key,
    required this.checkoutUrl,
    required this.txRef,
  });

  @override
  ConsumerState<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends ConsumerState<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _isLoading = true),
        onPageFinished: (_) => setState(() => _isLoading = false),
        onNavigationRequest: (request) {
          // Intercept return URL after payment completion
          if (request.url.contains('payment/callback') ||
              request.url.contains('payment/return') ||
              request.url.contains('verify')) {
            ref.read(payRentProvider.notifier).verifyPayment(widget.txRef);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(widget.checkoutUrl));

    ref.listenManual(payRentProvider, (prev, next) {
      if (next is PayRentSuccess) {
        context.go('/payments/result', extra: next.payment);
      } else if (next is PayRentError) {
        context.go('/payments/result');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Payment'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            ref.read(payRentProvider.notifier).verifyPayment(widget.txRef);
          },
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading) const LinearProgressIndicator(),
        ],
      ),
    );
  }
}
