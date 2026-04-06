// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_schedule.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaymentSchedule _$PaymentScheduleFromJson(Map<String, dynamic> json) =>
    PaymentSchedule(
      id: json['_id'] as String,
      tenantId: json['tenantId'] as String?,
      propertyId: json['propertyId'] as String?,
      unitId: json['unitId'] as String?,
      amount: json['amount'] as num,
      dueDate: json['dueDate'] as String?,
      status: json['status'] as String,
      paidAmount: json['paidAmount'] as num?,
      paidDate: json['paidDate'] as String?,
      createdAt: json['createdAt'] as String?,
    );

Map<String, dynamic> _$PaymentScheduleToJson(PaymentSchedule instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'tenantId': instance.tenantId,
      'propertyId': instance.propertyId,
      'unitId': instance.unitId,
      'amount': instance.amount,
      'dueDate': instance.dueDate,
      'status': instance.status,
      'paidAmount': instance.paidAmount,
      'paidDate': instance.paidDate,
      'createdAt': instance.createdAt,
    };
