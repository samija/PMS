import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import 'payment.dart';

abstract class PaymentRepository {
  Future<Either<Failure, PaginatedPayments>> getPayments({
    int page = 1,
    int limit = 10,
    String? status,
    String? type,
  });
  Future<Either<Failure, Payment>> getPayment(String id);
  Future<Either<Failure, PaymentInitResult>> initializePayment({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    String? gateway,
  });
  Future<Either<Failure, Payment>> verifyPayment(String txRef);
  Future<Either<Failure, List<PaymentGateway>>> getGateways();
  Future<Either<Failure, Payment>> submitBankTransfer({
    required String tenantId,
    required num amount,
    required String type,
    required int month,
    required int year,
    required String receiptPath,
  });
  Future<Either<Failure, List<Payment>>> getPendingApprovals();
  Future<Either<Failure, Payment>> approvePayment(String id);
  Future<Either<Failure, Payment>> rejectPayment(String id, String reason);
}
