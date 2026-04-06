// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceRequest _$MaintenanceRequestFromJson(Map<String, dynamic> json) =>
    MaintenanceRequest(
      id: json['_id'] as String,
      propertyId: json['propertyId'],
      unitId: json['unitId'],
      tenantId: json['tenantId'],
      title: json['title'] as String,
      description: json['description'] as String,
      category: json['category'] as String,
      priority: json['priority'] as String,
      status: json['status'] as String,
      assignedTo: json['assignedTo'],
      images:
          (json['images'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      completionImages:
          (json['completionImages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      estimatedCost: json['estimatedCost'] as num?,
      actualCost: json['actualCost'] as num?,
      timeline:
          (json['timeline'] as List<dynamic>?)
              ?.map((e) => TimelineEntry.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      scheduledDate: json['scheduledDate'] as String?,
      completedAt: json['completedAt'] as String?,
      tenantRating: (json['tenantRating'] as num?)?.toInt(),
      tenantFeedback: json['tenantFeedback'] as String?,
      createdAt: json['createdAt'] as String?,
    );

Map<String, dynamic> _$MaintenanceRequestToJson(MaintenanceRequest instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'propertyId': instance.propertyId,
      'unitId': instance.unitId,
      'tenantId': instance.tenantId,
      'title': instance.title,
      'description': instance.description,
      'category': instance.category,
      'priority': instance.priority,
      'status': instance.status,
      'assignedTo': instance.assignedTo,
      'images': instance.images,
      'completionImages': instance.completionImages,
      'estimatedCost': instance.estimatedCost,
      'actualCost': instance.actualCost,
      'timeline': instance.timeline,
      'scheduledDate': instance.scheduledDate,
      'completedAt': instance.completedAt,
      'tenantRating': instance.tenantRating,
      'tenantFeedback': instance.tenantFeedback,
      'createdAt': instance.createdAt,
    };

TimelineEntry _$TimelineEntryFromJson(Map<String, dynamic> json) =>
    TimelineEntry(
      status: json['status'] as String,
      timestamp: json['timestamp'] as String?,
      note: json['note'] as String?,
      updatedBy: json['updatedBy'],
    );

Map<String, dynamic> _$TimelineEntryToJson(TimelineEntry instance) =>
    <String, dynamic>{
      'status': instance.status,
      'timestamp': instance.timestamp,
      'note': instance.note,
      'updatedBy': instance.updatedBy,
    };
