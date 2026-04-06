import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/payment.dart';
import '../domain/payment_repository.dart';
import '../infrastructure/payment_remote_data_source.dart';
import '../infrastructure/payment_repository_impl.dart';

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return PaymentRepositoryImpl(PaymentRemoteDataSource(dio));
});

final paymentListProvider =
    AsyncNotifierProvider<PaymentListNotifier, PaginatedPayments>(PaymentListNotifier.new);

class PaymentListNotifier extends AsyncNotifier<PaginatedPayments> {
  int _currentPage = 1;
  String? _statusFilter;
  String? _typeFilter;

  @override
  Future<PaginatedPayments> build() => _fetch();

  PaymentRepository get _repo => ref.read(paymentRepositoryProvider);

  Future<PaginatedPayments> _fetch() async {
    final result = await _repo.getPayments(
      page: _currentPage,
      status: _statusFilter,
      type: _typeFilter,
    );
    return result.fold(
      (f) => throw Exception(f.message),
      (data) => data,
    );
  }

  Future<void> refresh() async {
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> setFilter({String? status, String? type}) async {
    _statusFilter = status;
    _typeFilter = type;
    _currentPage = 1;
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || _currentPage >= current.pages) return;
    _currentPage++;
    final result = await _repo.getPayments(
      page: _currentPage,
      status: _statusFilter,
      type: _typeFilter,
    );
    result.fold(
      (_) => _currentPage--,
      (newData) {
        state = AsyncData(PaginatedPayments(
          payments: [...current.payments, ...newData.payments],
          total: newData.total,
          page: newData.page,
          pages: newData.pages,
        ));
      },
    );
  }
}

final paymentDetailProvider =
    FutureProvider.family<Payment?, String>((ref, id) async {
  final repo = ref.read(paymentRepositoryProvider);
  final result = await repo.getPayment(id);
  return result.fold(
    (f) => throw Exception(f.message),
    (payment) => payment,
  );
});

final gatewaysProvider = FutureProvider<List<PaymentGateway>>((ref) async {
  final repo = ref.read(paymentRepositoryProvider);
  final result = await repo.getGateways();
  return result.fold(
    (f) => throw Exception(f.message),
    (gateways) => gateways.where((g) => g.isEnabled).toList(),
  );
});

// Payment flow state
sealed class PayRentState {
  const PayRentState();
}

class PayRentInitial extends PayRentState {
  const PayRentInitial();
}

class PayRentLoading extends PayRentState {
  const PayRentLoading();
}

class PayRentCheckout extends PayRentState {
  final String checkoutUrl;
  final String txRef;
  const PayRentCheckout({required this.checkoutUrl, required this.txRef});
}

class PayRentVerifying extends PayRentState {
  const PayRentVerifying();
}

class PayRentSuccess extends PayRentState {
  final Payment payment;
  const PayRentSuccess(this.payment);
}

class PayRentError extends PayRentState {
  final String message;
  const PayRentError(this.message);
}

final payRentProvider = NotifierProvider<PayRentNotifier, PayRentState>(PayRentNotifier.new);

class PayRentNotifier extends Notifier<PayRentState> {
  @override
  PayRentState build() => const PayRentInitial();

  PaymentRepository get _repo => ref.read(paymentRepositoryProvider);

  Future<void> initializePayment({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    String? gateway,
  }) async {
    state = const PayRentLoading();
    final result = await _repo.initializePayment(
      tenantId: tenantId,
      amount: amount,
      type: type,
      month: month,
      year: year,
      gateway: gateway,
    );
    state = result.fold(
      (f) => PayRentError(f.message),
      (data) => PayRentCheckout(checkoutUrl: data.checkoutUrl, txRef: data.txRef),
    );
  }

  Future<void> verifyPayment(String txRef) async {
    state = const PayRentVerifying();
    final result = await _repo.verifyPayment(txRef);
    state = result.fold(
      (f) => PayRentError(f.message),
      (payment) => PayRentSuccess(payment),
    );
  }

  Future<void> submitBankTransfer({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    required String receiptPath,
  }) async {
    state = const PayRentLoading();
    final result = await _repo.submitBankTransfer(
      tenantId: tenantId,
      amount: amount,
      type: type,
      month: month,
      year: year,
      receiptPath: receiptPath,
    );
    state = result.fold(
      (f) => PayRentError(f.message),
      (payment) => PayRentSuccess(payment),
    );
  }

  void reset() => state = const PayRentInitial();
}

// ── Pending Approvals ──────────────────────────────────────────────────────

final pendingApprovalsProvider =
    AsyncNotifierProvider<PendingApprovalsNotifier, List<Payment>>(
  PendingApprovalsNotifier.new,
);

class PendingApprovalsNotifier extends AsyncNotifier<List<Payment>> {
  @override
  Future<List<Payment>> build() => _fetch();

  PaymentRepository get _repo => ref.read(paymentRepositoryProvider);

  Future<List<Payment>> _fetch() async {
    final result = await _repo.getPendingApprovals();
    return result.fold(
      (f) => throw Exception(f.message),
      (payments) => payments,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<bool> approvePayment(String id) async {
    final result = await _repo.approvePayment(id);
    return result.fold(
      (f) => false,
      (payment) {
        final current = state.value ?? [];
        state = AsyncData(current.where((p) => p.id != id).toList());
        return true;
      },
    );
  }

  Future<bool> rejectPayment(String id, String reason) async {
    final result = await _repo.rejectPayment(id, reason);
    return result.fold(
      (f) => false,
      (payment) {
        final current = state.value ?? [];
        state = AsyncData(current.where((p) => p.id != id).toList());
        return true;
      },
    );
  }
}
