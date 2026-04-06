// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'booking_application.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookingApplication _$BookingApplicationFromJson(Map<String, dynamic> json) =>
    BookingApplication(
      id: json['_id'] as String,
      listingId: json['listingId'] as String,
      applicantName: json['applicantName'] as String,
      applicantEmail: json['applicantEmail'] as String,
      applicantPhone: json['applicantPhone'] as String,
      moveInDate: json['moveInDate'] == null
          ? null
          : DateTime.parse(json['moveInDate'] as String),
      message: json['message'] as String?,
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$BookingApplicationToJson(BookingApplication instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'listingId': instance.listingId,
      'applicantName': instance.applicantName,
      'applicantEmail': instance.applicantEmail,
      'applicantPhone': instance.applicantPhone,
      'moveInDate': instance.moveInDate?.toIso8601String(),
      'message': instance.message,
      'status': instance.status,
      'createdAt': instance.createdAt?.toIso8601String(),
    };
