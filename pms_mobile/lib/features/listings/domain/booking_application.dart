import 'package:json_annotation/json_annotation.dart';

part 'booking_application.g.dart';

@JsonSerializable()
class BookingApplication {
  @JsonKey(name: '_id')
  final String id;
  final String listingId;
  final String applicantName;
  final String applicantEmail;
  final String applicantPhone;
  final DateTime? moveInDate;
  final String? message;
  final String status;
  final DateTime? createdAt;

  const BookingApplication({
    required this.id,
    required this.listingId,
    required this.applicantName,
    required this.applicantEmail,
    required this.applicantPhone,
    this.moveInDate,
    this.message,
    this.status = 'pending',
    this.createdAt,
  });

  factory BookingApplication.fromJson(Map<String, dynamic> json) =>
      _$BookingApplicationFromJson(json);
  Map<String, dynamic> toJson() => _$BookingApplicationToJson(this);

  bool get isPending => status.toLowerCase() == 'pending';
  bool get isApproved => status.toLowerCase() == 'approved';
  bool get isRejected => status.toLowerCase() == 'rejected';
}
