// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: json['_id'] as String?,
  email: json['email'] as String,
  name: json['name'] as String,
  phone: json['phone'] as String?,
  role: json['role'] as String,
  avatar: json['avatar'] as String?,
  isVerified: json['isVerified'] as bool? ?? false,
  authProvider: json['authProvider'] as String?,
  createdAt: json['createdAt'] as String?,
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  '_id': instance.id,
  'email': instance.email,
  'name': instance.name,
  'phone': instance.phone,
  'role': instance.role,
  'avatar': instance.avatar,
  'isVerified': instance.isVerified,
  'authProvider': instance.authProvider,
  'createdAt': instance.createdAt,
};
