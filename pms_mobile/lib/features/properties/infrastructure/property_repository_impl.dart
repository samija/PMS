import 'package:dartz/dartz.dart';

import '../../../core/errors/failures.dart';
import '../../../core/network/api_exception_handler.dart';
import '../domain/property.dart' as prop;
import '../domain/property.dart' show Property, PaginatedProperties;
import '../domain/property_repository.dart';
import 'property_remote_data_source.dart';

class PropertyRepositoryImpl implements PropertyRepository {
  final PropertyRemoteDataSource _dataSource;

  PropertyRepositoryImpl(this._dataSource);

  @override
  Future<Either<Failure, PaginatedProperties>> getProperties({int page = 1}) async {
    try {
      return Right(await _dataSource.getProperties(page: page));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Property>> getProperty(String id) async {
    try {
      return Right(await _dataSource.getProperty(id));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Property>> createProperty({
    required String name,
    required String type,
    required Map<String, String> address,
    required int totalFloors,
    required int totalUnits,
    List<String> amenities = const [],
    String? description,
    List<String> imagePaths = const [],
  }) async {
    try {
      return Right(await _dataSource.createProperty(
        name: name,
        type: type,
        address: address,
        totalFloors: totalFloors,
        totalUnits: totalUnits,
        amenities: amenities,
        description: description,
        imagePaths: imagePaths,
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Property>> updateProperty(String id, Map<String, dynamic> data) async {
    try {
      return Right(await _dataSource.updateProperty(id, data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> deleteProperty(String id) async {
    try {
      await _dataSource.deleteProperty(id);
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, Property>> toggleListing(String id) async {
    try {
      return Right(await _dataSource.toggleListing(id));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, List<prop.Unit>>> getUnits(String propertyId, {String? status}) async {
    try {
      return Right(await _dataSource.getUnits(propertyId, status: status));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, prop.Unit>> addUnit({
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
    try {
      return Right(await _dataSource.addUnit(
        propertyId: propertyId,
        unitNumber: unitNumber,
        type: type,
        floor: floor,
        size: size,
        basePrice: basePrice,
        amenityCharges: amenityCharges,
        features: features,
        imagePaths: imagePaths,
      ));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, prop.Unit>> updateUnit(String propertyId, String unitId, Map<String, dynamic> data) async {
    try {
      return Right(await _dataSource.updateUnit(propertyId, unitId, data));
    } catch (e) {
      return handleException(e);
    }
  }

  @override
  Future<Either<Failure, void>> deleteUnit(String propertyId, String unitId) async {
    try {
      await _dataSource.deleteUnit(propertyId, unitId);
      return const Right(null);
    } catch (e) {
      return handleException(e);
    }
  }
}
