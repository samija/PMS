import 'package:json_annotation/json_annotation.dart';

part 'payment.g.dart';

@JsonSerializable()
class Payment {
  @JsonKey(name: '_id')
  final String id;
  final dynamic tenantId;
  final dynamic unitId;
  final dynamic propertyId;
  final num amount;
  final String type;
  final String status;
  final String? paymentMethod;
  final String? dueDate;
  final String? paidAt;
  final int? month;
  final int? year;
  final String? chapaReference;
  final String? chapaTxRef;
  final String? gatewayTransactionRef;
  final String? bankTransferReceipt;
  final String? bankTransferApprovalStatus;
  final PaymentReceipt? receipt;
  final String? createdAt;

  const Payment({
    required this.id,
    this.tenantId,
    this.unitId,
    this.propertyId,
    required this.amount,
    required this.type,
    required this.status,
    this.paymentMethod,
    this.dueDate,
    this.paidAt,
    this.month,
    this.year,
    this.chapaReference,
    this.chapaTxRef,
    this.gatewayTransactionRef,
    this.bankTransferReceipt,
    this.bankTransferApprovalStatus,
    this.receipt,
    this.createdAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => _$PaymentFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentToJson(this);

  bool get isPending => status == 'pending';
  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
  bool get isOverdue {
    if (dueDate == null || isCompleted) return false;
    return DateTime.parse(dueDate!).isBefore(DateTime.now());
  }

  String get propertyName {
    if (propertyId is Map) return (propertyId as Map)['name'] ?? '';
    return '';
  }

  String get unitNumber {
    if (unitId is Map) return (unitId as Map)['unitNumber'] ?? '';
    return '';
  }
}

@JsonSerializable()
class PaymentReceipt {
  final String? number;
  final String? generatedAt;
  final String? url;

  const PaymentReceipt({this.number, this.generatedAt, this.url});

  factory PaymentReceipt.fromJson(Map<String, dynamic> json) => _$PaymentReceiptFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentReceiptToJson(this);
}

@JsonSerializable()
class PaymentGateway {
  final String type;
  final String name;
  final String? description;
  final bool isEnabled;
  final bool isTestMode;

  const PaymentGateway({
    required this.type,
    required this.name,
    this.description,
    this.isEnabled = true,
    this.isTestMode = false,
  });

  factory PaymentGateway.fromJson(Map<String, dynamic> json) => _$PaymentGatewayFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentGatewayToJson(this);
}

class PaymentInitResult {
  final String checkoutUrl;
  final String txRef;
  final Payment payment;

  const PaymentInitResult({
    required this.checkoutUrl,
    required this.txRef,
    required this.payment,
  });
}

class PaginatedPayments {
  final List<Payment> payments;
  final int total;
  final int page;
  final int pages;

  const PaginatedPayments({
    required this.payments,
    required this.total,
    required this.page,
    required this.pages,
  });
}
