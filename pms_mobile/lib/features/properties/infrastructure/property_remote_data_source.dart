import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../domain/property.dart';

class PropertyRemoteDataSource {
  final Dio _dio;

  PropertyRemoteDataSource(this._dio);

  Future<PaginatedProperties> getProperties({int page = 1}) async {
    final response = await _dio.get(
      ApiConstants.properties,
      queryParameters: {'page': page, 'limit': 10},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? response.data;
    return PaginatedProperties.fromJson(data);
  }

  Future<Property> getProperty(String id) async {
    final response = await _dio.get(ApiConstants.property(id));
    return Property.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<Property> createProperty({
    required String name,
    required String type,
    required Map<String, String> address,
    required int totalFloors,
    required int totalUnits,
    List<String> amenities = const [],
    String? description,
    List<String> imagePaths = const [],
  }) async {
    final formData = FormData.fromMap({
      'name': name,
      'type': type,
      'address': address.toString(),
      'totalFloors': totalFloors,
      'totalUnits': totalUnits,
      'amenities': amenities.toString(),
      if (description != null) 'description': description,
    });
    for (final path in imagePaths) {
      formData.files.add(MapEntry(
        'images',
        await MultipartFile.fromFile(path),
      ));
    }
    final response = await _dio.post(ApiConstants.properties, data: formData);
    return Property.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<Property> updateProperty(String id, Map<String, dynamic> data) async {
    final response = await _dio.put(ApiConstants.property(id), data: data);
    return Property.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<void> deleteProperty(String id) async {
    await _dio.delete(ApiConstants.property(id));
  }

  Future<Property> toggleListing(String id) async {
    final response = await _dio.patch(ApiConstants.toggleListing(id));
    return Property.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<List<Unit>> getUnits(String propertyId, {String? status}) async {
    final response = await _dio.get(
      ApiConstants.propertyUnits(propertyId),
      queryParameters: {if (status != null) 'status': status},
    );
    final data = response.data['data'];
    if (data is List) {
      return data.map((e) => Unit.fromJson(e as Map<String, dynamic>)).toList();
    }
    return (data['units'] as List? ?? [])
        .map((e) => Unit.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Unit> addUnit({
    required String propertyId,
    required String unitNumber,
    required String type,
    required int floor,
    required num size,
    num? basePrice,
    num? amenityCharges,
    List<String> features = const [],
    List<String> imagePaths = const [],
  }) async {
    final formData = FormData.fromMap({
      'unitNumber': unitNumber,
      'type': type,
      'floor': floor,
      'size': size,
      if (basePrice != null || amenityCharges != null)
        'pricing': '{"basePrice":${basePrice ?? 0},"amenityCharges":${amenityCharges ?? 0}}',
      'features': features.toString(),
    });
    for (final path in imagePaths) {
      formData.files.add(MapEntry('images', await MultipartFile.fromFile(path)));
    }
    final response = await _dio.post(
      ApiConstants.propertyUnits(propertyId),
      data: formData,
    );
    return Unit.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<Unit> updateUnit(String propertyId, String unitId, Map<String, dynamic> data) async {
    final response = await _dio.put(
      '${ApiConstants.propertyUnits(propertyId)}/$unitId',
      data: data,
    );
    return Unit.fromJson(
      response.data['data'] as Map<String, dynamic>? ?? response.data,
    );
  }

  Future<void> deleteUnit(String propertyId, String unitId) async {
    await _dio.delete('${ApiConstants.propertyUnits(propertyId)}/$unitId');
  }
}
