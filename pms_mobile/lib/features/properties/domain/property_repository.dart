import 'package:dartz/dartz.dart';
import '../../../core/errors/failures.dart';
import 'property.dart' as prop;
import 'property.dart' show Property, PaginatedProperties;

abstract class PropertyRepository {
  Future<Either<Failure, PaginatedProperties>> getProperties({int page = 1});
  Future<Either<Failure, Property>> getProperty(String id);
  Future<Either<Failure, Property>> createProperty({
    required String name,
    required String type,
    required Map<String, String> address,
    required int totalFloors,
    required int totalUnits,
    List<String> amenities,
    String? description,
    List<String> imagePaths,
  });
  Future<Either<Failure, Property>> updateProperty(String id, Map<String, dynamic> data);
  Future<Either<Failure, void>> deleteProperty(String id);
  Future<Either<Failure, Property>> toggleListing(String id);
  Future<Either<Failure, List<prop.Unit>>> getUnits(String propertyId, {String? status});
  Future<Either<Failure, prop.Unit>> addUnit({
    required String propertyId,
    required String unitNumber,
    required String type,
    required int floor,
    required num size,
    num? basePrice,
    num? amenityCharges,
    List<String> features,
    List<String> imagePaths,
  });
  Future<Either<Failure, prop.Unit>> updateUnit(String propertyId, String unitId, Map<String, dynamic> data);
  Future<Either<Failure, void>> deleteUnit(String propertyId, String unitId);
}
