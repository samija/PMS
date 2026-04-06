import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  @JsonKey(name: '_id')
  final String? id;
  final String email;
  final String name;
  final String? phone;
  final String role;
  final String? avatar;
  final bool isVerified;
  final String? authProvider;
  final String? createdAt;

  const User({
    this.id,
    required this.email,
    required this.name,
    this.phone,
    required this.role,
    this.avatar,
    this.isVerified = false,
    this.authProvider,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  bool get isTenant => role == 'tenant';
  bool get isOwner => role == 'owner';
  bool get isAdmin => role == 'admin';
}
