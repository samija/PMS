import 'package:json_annotation/json_annotation.dart';

part 'payment_schedule.g.dart';

@JsonSerializable()
class PaymentSchedule {
  @JsonKey(name: '_id')
  final String id;
  final String? tenantId;
  final String? propertyId;
  final String? unitId;
  final num amount;
  final String? dueDate;
  final String status; // upcoming, paid, overdue, partial
  final num? paidAmount;
  final String? paidDate;
  final String? createdAt;

  const PaymentSchedule({
    required this.id,
    this.tenantId,
    this.propertyId,
    this.unitId,
    required this.amount,
    this.dueDate,
    required this.status,
    this.paidAmount,
    this.paidDate,
    this.createdAt,
  });

  factory PaymentSchedule.fromJson(Map<String, dynamic> json) =>
      _$PaymentScheduleFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentScheduleToJson(this);

  bool get isPaid => status == 'paid';
  bool get isOverdue => status == 'overdue';
  bool get isUpcoming => status == 'upcoming';
}
