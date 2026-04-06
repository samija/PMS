// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Payment _$PaymentFromJson(Map<String, dynamic> json) => Payment(
  id: json['_id'] as String,
  tenantId: json['tenantId'],
  unitId: json['unitId'],
  propertyId: json['propertyId'],
  amount: json['amount'] as num,
  type: json['type'] as String,
  status: json['status'] as String,
  paymentMethod: json['paymentMethod'] as String?,
  dueDate: json['dueDate'] as String?,
  paidAt: json['paidAt'] as String?,
  month: (json['month'] as num?)?.toInt(),
  year: (json['year'] as num?)?.toInt(),
  chapaReference: json['chapaReference'] as String?,
  chapaTxRef: json['chapaTxRef'] as String?,
  gatewayTransactionRef: json['gatewayTransactionRef'] as String?,
  bankTransferReceipt: json['bankTransferReceipt'] as String?,
  bankTransferApprovalStatus: json['bankTransferApprovalStatus'] as String?,
  receipt: json['receipt'] == null
      ? null
      : PaymentReceipt.fromJson(json['receipt'] as Map<String, dynamic>),
  createdAt: json['createdAt'] as String?,
);

Map<String, dynamic> _$PaymentToJson(Payment instance) => <String, dynamic>{
  '_id': instance.id,
  'tenantId': instance.tenantId,
  'unitId': instance.unitId,
  'propertyId': instance.propertyId,
  'amount': instance.amount,
  'type': instance.type,
  'status': instance.status,
  'paymentMethod': instance.paymentMethod,
  'dueDate': instance.dueDate,
  'paidAt': instance.paidAt,
  'month': instance.month,
  'year': instance.year,
  'chapaReference': instance.chapaReference,
  'chapaTxRef': instance.chapaTxRef,
  'gatewayTransactionRef': instance.gatewayTransactionRef,
  'bankTransferReceipt': instance.bankTransferReceipt,
  'bankTransferApprovalStatus': instance.bankTransferApprovalStatus,
  'receipt': instance.receipt,
  'createdAt': instance.createdAt,
};

PaymentReceipt _$PaymentReceiptFromJson(Map<String, dynamic> json) =>
    PaymentReceipt(
      number: json['number'] as String?,
      generatedAt: json['generatedAt'] as String?,
      url: json['url'] as String?,
    );

Map<String, dynamic> _$PaymentReceiptToJson(PaymentReceipt instance) =>
    <String, dynamic>{
      'number': instance.number,
      'generatedAt': instance.generatedAt,
      'url': instance.url,
    };

PaymentGateway _$PaymentGatewayFromJson(Map<String, dynamic> json) =>
    PaymentGateway(
      type: json['type'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      isEnabled: json['isEnabled'] as bool? ?? true,
      isTestMode: json['isTestMode'] as bool? ?? false,
    );

Map<String, dynamic> _$PaymentGatewayToJson(PaymentGateway instance) =>
    <String, dynamic>{
      'type': instance.type,
      'name': instance.name,
      'description': instance.description,
      'isEnabled': instance.isEnabled,
      'isTestMode': instance.isTestMode,
    };
