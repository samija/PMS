import 'package:json_annotation/json_annotation.dart';

part 'maintenance_request.g.dart';

@JsonSerializable()
class MaintenanceRequest {
  @JsonKey(name: '_id')
  final String id;
  final dynamic propertyId;
  final dynamic unitId;
  final dynamic tenantId;
  final String title;
  final String description;
  final String category;
  final String priority;
  final String status;
  final dynamic assignedTo;
  final List<String> images;
  final List<String> completionImages;
  final num? estimatedCost;
  final num? actualCost;
  final List<TimelineEntry> timeline;
  final String? scheduledDate;
  final String? completedAt;
  final int? tenantRating;
  final String? tenantFeedback;
  final String? createdAt;

  const MaintenanceRequest({
    required this.id,
    this.propertyId,
    this.unitId,
    this.tenantId,
    required this.title,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    this.assignedTo,
    this.images = const [],
    this.completionImages = const [],
    this.estimatedCost,
    this.actualCost,
    this.timeline = const [],
    this.scheduledDate,
    this.completedAt,
    this.tenantRating,
    this.tenantFeedback,
    this.createdAt,
  });

  factory MaintenanceRequest.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceRequestFromJson(json);
  Map<String, dynamic> toJson() => _$MaintenanceRequestToJson(this);

  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get canSubmitFeedback => isCompleted && tenantRating == null;

  String get assignedToName {
    if (assignedTo is Map) return (assignedTo as Map)['name'] ?? 'Unassigned';
    return 'Unassigned';
  }
}

@JsonSerializable()
class TimelineEntry {
  final String status;
  final String? timestamp;
  final String? note;
  final dynamic updatedBy;

  const TimelineEntry({
    required this.status,
    this.timestamp,
    this.note,
    this.updatedBy,
  });

  factory TimelineEntry.fromJson(Map<String, dynamic> json) => _$TimelineEntryFromJson(json);
  Map<String, dynamic> toJson() => _$TimelineEntryToJson(this);

  String get updatedByName {
    if (updatedBy is Map) return (updatedBy as Map)['name'] ?? '';
    return '';
  }
}

class PaginatedMaintenance {
  final List<MaintenanceRequest> requests;
  final int total;
  final int page;
  final int pages;

  const PaginatedMaintenance({
    required this.requests,
    required this.total,
    required this.page,
    required this.pages,
  });
}
