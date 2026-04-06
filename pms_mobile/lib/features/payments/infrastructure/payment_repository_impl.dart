import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/payment.dart';
import '../domain/payment_repository.dart';
import 'payment_remote_data_source.dart';

class PaymentRepositoryImpl implements PaymentRepository {
  final PaymentRemoteDataSource _remoteDataSource;

  PaymentRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, PaginatedPayments>> getPayments({
    int page = 1,
    int limit = 10,
    String? status,
    String? type,
  }) async {
    try {
      final data = await _remoteDataSource.getPayments(
        page: page, limit: limit, status: status, type: type,
      );
      final payments = (data['payments'] as List)
          .map((e) => Payment.fromJson(e as Map<String, dynamic>))
          .toList();
      final pagination = data['pagination'] as Map<String, dynamic>;
      return Right(PaginatedPayments(
        payments: payments,
        total: pagination['total'] as int,
        page: pagination['page'] as int,
        pages: pagination['pages'] as int,
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Payment>> getPayment(String id) async {
    try {
      final data = await _remoteDataSource.getPayment(id);
      return Right(Payment.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, PaymentInitResult>> initializePayment({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    String? gateway,
  }) async {
    try {
      final data = await _remoteDataSource.initializePayment(
        tenantId: tenantId, amount: amount, type: type,
        month: month, year: year, gateway: gateway,
      );
      return Right(PaymentInitResult(
        checkoutUrl: data['checkoutUrl'] as String,
        txRef: data['txRef'] as String,
        payment: Payment.fromJson(data['payment'] as Map<String, dynamic>),
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Payment>> verifyPayment(String txRef) async {
    try {
      final data = await _remoteDataSource.verifyPayment(txRef);
      return Right(Payment.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, List<PaymentGateway>>> getGateways() async {
    try {
      final data = await _remoteDataSource.getGateways();
      return Right(data.map((e) => PaymentGateway.fromJson(e as Map<String, dynamic>)).toList());
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Payment>> submitBankTransfer({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    required String receiptPath,
  }) async {
    try {
      final data = await _remoteDataSource.submitBankTransfer(
        tenantId: tenantId, amount: amount, type: type,
        month: month, year: year, receiptPath: receiptPath,
      );
      return Right(Payment.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, List<Payment>>> getPendingApprovals() async {
    try {
      final data = await _remoteDataSource.getPendingApprovals();
      final payments = data
          .map((e) => Payment.fromJson(e as Map<String, dynamic>))
          .toList();
      return Right(payments);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Payment>> approvePayment(String id) async {
    try {
      final data = await _remoteDataSource.approvePayment(id);
      return Right(Payment.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Payment>> rejectPayment(String id, String reason) async {
    try {
      final data = await _remoteDataSource.rejectPayment(id, reason);
      return Right(Payment.fromJson(data));
    } catch (e) {
      return handleException(e);
    }
  }
}
