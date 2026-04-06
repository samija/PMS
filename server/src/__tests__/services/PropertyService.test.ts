/**
 * PropertyService Unit Tests
 *
 * Tests for the PropertyService which handles property and unit management.
 */

import { Types } from 'mongoose';
import { PropertyService } from '../../application/services/PropertyService';
import {
  createMockProperty,
  createMockPropertyModel,
  createMockUnit,
  createMockUnitModel,
  createMockPropertyStaff,
  createMockPropertyStaffModel,
  createChainableQuery,
} from '../mocks/repositories';
import { NotFoundError, ConflictError, BadRequestError } from '../../domain/exceptions/AppError';

describe('PropertyService', () => {
  let propertyService: PropertyService;
  let mockPropertyModel: ReturnType<typeof createMockPropertyModel>;
  let mockUnitModel: ReturnType<typeof createMockUnitModel>;
  let mockPropertyStaffModel: ReturnType<typeof createMockPropertyStaffModel>;

  beforeEach(() => {
    mockPropertyModel = createMockPropertyModel();
    mockUnitModel = createMockUnitModel();
    mockPropertyStaffModel = createMockPropertyStaffModel();

    propertyService = new PropertyService(
      mockPropertyModel as any,
      mockUnitModel as any,
      mockPropertyStaffModel as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    const createPropertyData = {
      ownerId: new Types.ObjectId().toString(),
      name: 'New Apartment Complex',
      type: 'apartment',
      address: {
        street: '123 Main Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
      },
      totalFloors: 10,
      totalUnits: 50,
      amenities: ['parking', 'gym', 'pool'],
      description: 'A modern apartment complex',
    };

    it('should successfully create a property', async () => {
      // Arrange
      const mockCreatedProperty = createMockProperty({
        _id: new Types.ObjectId(),
        ...createPropertyData,
        ownerId: new Types.ObjectId(createPropertyData.ownerId),
      });

      mockPropertyModel.create.mockResolvedValue(mockCreatedProperty);

      // Act
      const result = await propertyService.createProperty(createPropertyData);

      // Assert
      expect(mockPropertyModel.create).toHaveBeenCalledWith({
        ownerId: expect.any(Types.ObjectId),
        name: createPropertyData.name,
        type: createPropertyData.type,
        address: createPropertyData.address,
        totalFloors: createPropertyData.totalFloors,
        totalUnits: createPropertyData.totalUnits,
        amenities: createPropertyData.amenities,
        description: createPropertyData.description,
        waitingListType: 'both',
        images: [],
      });
      expect(result).toEqual(mockCreatedProperty);
    });

    it('should create property with default waitingListType if not provided', async () => {
      // Arrange
      const dataWithoutWaitingList = { ...createPropertyData };
      const mockCreatedProperty = createMockProperty({
        waitingListType: 'both',
      });

      mockPropertyModel.create.mockResolvedValue(mockCreatedProperty);

      // Act
      await propertyService.createProperty(dataWithoutWaitingList);

      // Assert
      expect(mockPropertyModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ waitingListType: 'both' })
      );
    });

    it('should create property with custom waitingListType', async () => {
      // Arrange
      const dataWithWaitingList = {
        ...createPropertyData,
        waitingListType: 'queue',
      };
      const mockCreatedProperty = createMockProperty({
        waitingListType: 'queue',
      });

      mockPropertyModel.create.mockResolvedValue(mockCreatedProperty);

      // Act
      await propertyService.createProperty(dataWithWaitingList);

      // Assert
      expect(mockPropertyModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ waitingListType: 'queue' })
      );
    });
  });

  describe('getProperties', () => {
    const ownerId = new Types.ObjectId().toString();

    it('should return paginated properties for owner', async () => {
      // Arrange
      const mockProperties = [
        createMockProperty({ ownerId: new Types.ObjectId(ownerId) }),
        createMockProperty({ ownerId: new Types.ObjectId(ownerId) }),
      ];

      const chainableQuery = createChainableQuery(mockProperties);
      mockPropertyModel.find.mockReturnValue(chainableQuery);
      mockPropertyModel.countDocuments.mockResolvedValue(2);

      // Act
      const result = await propertyService.getProperties(ownerId, 'owner', { page: 1, limit: 10 });

      // Assert
      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: expect.any(Types.ObjectId) })
      );
      expect(result).toHaveProperty('properties');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should return all properties for admin', async () => {
      // Arrange
      const mockProperties = [createMockProperty(), createMockProperty(), createMockProperty()];

      const chainableQuery = createChainableQuery(mockProperties);
      mockPropertyModel.find.mockReturnValue(chainableQuery);
      mockPropertyModel.countDocuments.mockResolvedValue(3);

      // Act
      const result = await propertyService.getProperties(ownerId, 'admin', { page: 1, limit: 10 });

      // Assert
      expect(mockPropertyModel.find).toHaveBeenCalledWith({});
      expect(result.properties.length).toBe(3);
    });

    it('should filter properties by type', async () => {
      // Arrange
      const mockProperties = [createMockProperty({ type: 'apartment' })];

      const chainableQuery = createChainableQuery(mockProperties);
      mockPropertyModel.find.mockReturnValue(chainableQuery);
      mockPropertyModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await propertyService.getProperties(ownerId, 'owner', {
        page: 1,
        limit: 10,
        type: 'apartment',
      });

      // Assert
      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'apartment' })
      );
    });

    it('should get properties for staff user based on assignments', async () => {
      // Arrange
      const propertyId1 = new Types.ObjectId();
      const propertyId2 = new Types.ObjectId();
      const staffAssignments = [
        createMockPropertyStaff({ propertyId: propertyId1 }),
        createMockPropertyStaff({ propertyId: propertyId2 }),
      ];

      mockPropertyStaffModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(staffAssignments),
      });

      const mockProperties = [
        createMockProperty({ _id: propertyId1 }),
        createMockProperty({ _id: propertyId2 }),
      ];

      const chainableQuery = createChainableQuery(mockProperties);
      mockPropertyModel.find.mockReturnValue(chainableQuery);
      mockPropertyModel.countDocuments.mockResolvedValue(2);

      // Act
      const result = await propertyService.getProperties(ownerId, 'manager', { page: 1, limit: 10 });

      // Assert
      expect(mockPropertyStaffModel.find).toHaveBeenCalled();
      expect(mockPropertyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ _id: { $in: expect.any(Array) } })
      );
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const mockProperties = [createMockProperty()];

      const chainableQuery = createChainableQuery(mockProperties);
      mockPropertyModel.find.mockReturnValue(chainableQuery);
      mockPropertyModel.countDocuments.mockResolvedValue(25);

      // Act
      const result = await propertyService.getProperties(ownerId, 'owner', { page: 2, limit: 10 });

      // Assert
      expect(chainableQuery.skip).toHaveBeenCalledWith(10); // (page 2 - 1) * 10
      expect(chainableQuery.limit).toHaveBeenCalledWith(10);
      expect(result.pagination.pages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('getProperty', () => {
    it('should return property with units', async () => {
      // Arrange
      const propertyId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });
      const mockUnits = [
        createMockUnit({ propertyId: new Types.ObjectId(propertyId) }),
        createMockUnit({ propertyId: new Types.ObjectId(propertyId) }),
      ];

      mockPropertyModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockProperty),
      });
      mockUnitModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUnits),
      });

      // Act
      const result = await propertyService.getProperty(propertyId, userId);

      // Assert
      expect(mockPropertyModel.findOne).toHaveBeenCalledWith({
        _id: propertyId,
        ownerId: expect.any(Types.ObjectId),
      });
      expect(result).toHaveProperty('units');
      expect(result.units.length).toBe(2);
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      const propertyId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      mockPropertyModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await expect(propertyService.getProperty(propertyId, userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProperty', () => {
    const propertyId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const updateData = {
      name: 'Updated Property Name',
      description: 'Updated description',
    };

    it('should successfully update a property', async () => {
      // Arrange
      const mockUpdatedProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        name: updateData.name,
        description: updateData.description,
      });

      mockPropertyModel.findOneAndUpdate.mockResolvedValue(mockUpdatedProperty);

      // Act
      const result = await propertyService.updateProperty(propertyId, userId, updateData);

      // Assert
      expect(mockPropertyModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: propertyId, ownerId: expect.any(Types.ObjectId) },
        updateData,
        { new: true, runValidators: true }
      );
      expect(result.name).toBe(updateData.name);
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOneAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(
        propertyService.updateProperty(propertyId, userId, updateData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProperty', () => {
    const propertyId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should successfully delete a property and its units', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });

      mockPropertyModel.findOneAndDelete.mockResolvedValue(mockProperty);
      mockUnitModel.deleteMany.mockResolvedValue({ deletedCount: 5 });

      // Act
      await propertyService.deleteProperty(propertyId, userId);

      // Assert
      expect(mockPropertyModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: propertyId,
        ownerId: expect.any(Types.ObjectId),
      });
      expect(mockUnitModel.deleteMany).toHaveBeenCalledWith({
        propertyId: expect.any(Types.ObjectId),
      });
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOneAndDelete.mockResolvedValue(null);

      // Act & Assert
      await expect(propertyService.deleteProperty(propertyId, userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('addUnit', () => {
    const propertyId = new Types.ObjectId().toString();
    const createUnitData = {
      propertyId,
      unitNumber: 'A101',
      floor: 1,
      type: '2bed',
      size: 80,
      basePrice: 15000,
      amenityCharges: 500,
      features: ['balcony', 'parking'],
    };

    it('should successfully add a unit', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        totalFloors: 10,
      });
      const mockCreatedUnit = createMockUnit({
        ...createUnitData,
        propertyId: new Types.ObjectId(propertyId),
      });

      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(null);
      mockUnitModel.create.mockResolvedValue(mockCreatedUnit);

      // Act
      const result = await propertyService.addUnit(createUnitData);

      // Assert
      expect(mockPropertyModel.findById).toHaveBeenCalledWith(propertyId);
      expect(mockUnitModel.findOne).toHaveBeenCalledWith({
        propertyId: expect.any(Types.ObjectId),
        unitNumber: createUnitData.unitNumber,
      });
      expect(mockUnitModel.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUnit);
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(propertyService.addUnit(createUnitData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when unit number already exists', async () => {
      // Arrange
      const mockProperty = createMockProperty({ _id: new Types.ObjectId(propertyId) });
      const existingUnit = createMockUnit({ unitNumber: createUnitData.unitNumber });

      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(existingUnit);

      // Act & Assert
      await expect(propertyService.addUnit(createUnitData)).rejects.toThrow(ConflictError);
      await expect(propertyService.addUnit(createUnitData)).rejects.toThrow(
        'Unit number already exists in this property'
      );
    });

    it('should calculate pricing with floor multiplier', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        totalFloors: 10,
      });
      const mockCreatedUnit = createMockUnit();

      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(null);
      mockUnitModel.create.mockResolvedValue(mockCreatedUnit);

      // Act
      await propertyService.addUnit(createUnitData);

      // Assert
      expect(mockUnitModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pricing: expect.objectContaining({
            basePrice: createUnitData.basePrice,
            floorMultiplier: expect.any(Number),
            amenityCharges: createUnitData.amenityCharges,
            totalPrice: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('getUnits', () => {
    const propertyId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should return units for a property', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });
      const mockUnits = [
        createMockUnit({ propertyId: new Types.ObjectId(propertyId), status: 'vacant' }),
        createMockUnit({ propertyId: new Types.ObjectId(propertyId), status: 'occupied' }),
      ];

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);

      const chainableQuery = createChainableQuery(mockUnits);
      mockUnitModel.find.mockReturnValue(chainableQuery);

      // Act
      const result = await propertyService.getUnits(propertyId, userId, {});

      // Assert
      expect(result.length).toBe(2);
    });

    it('should filter units by status', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });
      const mockUnits = [createMockUnit({ status: 'vacant' })];

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);

      const chainableQuery = createChainableQuery(mockUnits);
      mockUnitModel.find.mockReturnValue(chainableQuery);

      // Act
      const result = await propertyService.getUnits(propertyId, userId, { status: 'vacant' });

      // Assert
      expect(mockUnitModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'vacant' })
      );
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(propertyService.getUnits(propertyId, userId, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUnit', () => {
    const propertyId = new Types.ObjectId().toString();
    const unitId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const updateData = {
      basePrice: 18000,
      features: ['balcony', 'parking', 'gym access'],
    };

    it('should successfully update a unit', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
        totalFloors: 10,
      });
      const mockCurrentUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        floor: 3,
        pricing: {
          basePrice: 15000,
          floorMultiplier: 1.03,
          amenityCharges: 500,
          totalPrice: 15950,
        },
      });
      const mockUpdatedUnit = createMockUnit({
        ...mockCurrentUnit,
        pricing: {
          basePrice: 18000,
          floorMultiplier: 1.03,
          amenityCharges: 500,
          totalPrice: 19040,
        },
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockCurrentUnit);
      mockUnitModel.findOneAndUpdate.mockResolvedValue(mockUpdatedUnit);

      // Act
      const result = await propertyService.updateUnit(propertyId, unitId, userId, updateData);

      // Assert
      expect(mockUnitModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: unitId, propertyId: expect.any(Types.ObjectId) },
        expect.objectContaining({ pricing: expect.any(Object) }),
        { new: true, runValidators: true }
      );
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        propertyService.updateUnit(propertyId, unitId, userId, updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when unit does not exist', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        propertyService.updateUnit(propertyId, unitId, userId, updateData)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUnit', () => {
    const propertyId = new Types.ObjectId().toString();
    const unitId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should successfully delete a vacant unit', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'vacant',
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);
      mockUnitModel.findByIdAndDelete.mockResolvedValue(mockUnit);

      // Act
      await propertyService.deleteUnit(propertyId, unitId, userId);

      // Assert
      expect(mockUnitModel.findByIdAndDelete).toHaveBeenCalledWith(unitId);
    });

    it('should throw BadRequestError when trying to delete an occupied unit', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'occupied',
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);

      // Act & Assert
      await expect(propertyService.deleteUnit(propertyId, unitId, userId)).rejects.toThrow(
        BadRequestError
      );
      await expect(propertyService.deleteUnit(propertyId, unitId, userId)).rejects.toThrow(
        'Cannot delete an occupied unit'
      );
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(propertyService.deleteUnit(propertyId, unitId, userId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError when unit does not exist', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(propertyService.deleteUnit(propertyId, unitId, userId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('toggleListing', () => {
    const propertyId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    it('should toggle listing status from false to true', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
        isListed: false,
      });
      const saveMock = jest.fn().mockResolvedValue({ ...mockProperty, isListed: true });
      mockProperty.save = saveMock as any;

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);

      // Act
      const result = await propertyService.toggleListing(propertyId, userId);

      // Assert
      expect(mockProperty.isListed).toBe(true);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should toggle listing status from true to false', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(userId),
        isListed: true,
      });
      const saveMock = jest.fn().mockResolvedValue({ ...mockProperty, isListed: false });
      mockProperty.save = saveMock as any;

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);

      // Act
      const result = await propertyService.toggleListing(propertyId, userId);

      // Assert
      expect(mockProperty.isListed).toBe(false);
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(propertyService.toggleListing(propertyId, userId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('Image Management', () => {
    const propertyId = new Types.ObjectId().toString();
    const unitId = new Types.ObjectId().toString();
    const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];

    describe('addPropertyImages', () => {
      it('should add images to property', async () => {
        // Arrange
        const mockProperty = createMockProperty({
          _id: new Types.ObjectId(propertyId),
          images: ['existing-image.jpg'],
        });

        mockPropertyModel.findByIdAndUpdate.mockResolvedValue({
          ...mockProperty,
          images: [...mockProperty.images, ...imageUrls],
        });

        // Act
        const result = await propertyService.addPropertyImages(propertyId, imageUrls);

        // Assert
        expect(mockPropertyModel.findByIdAndUpdate).toHaveBeenCalledWith(
          propertyId,
          { $push: { images: { $each: imageUrls } } },
          { new: true }
        );
      });

      it('should throw NotFoundError when property does not exist', async () => {
        // Arrange
        mockPropertyModel.findByIdAndUpdate.mockResolvedValue(null);

        // Act & Assert
        await expect(propertyService.addPropertyImages(propertyId, imageUrls)).rejects.toThrow(
          NotFoundError
        );
      });
    });

    describe('deletePropertyImage', () => {
      it('should delete an image from property', async () => {
        // Arrange
        const imageUrl = 'https://example.com/image-to-delete.jpg';
        const mockProperty = createMockProperty({
          _id: new Types.ObjectId(propertyId),
          images: [],
        });

        mockPropertyModel.findByIdAndUpdate.mockResolvedValue(mockProperty);

        // Act
        const result = await propertyService.deletePropertyImage(propertyId, imageUrl);

        // Assert
        expect(mockPropertyModel.findByIdAndUpdate).toHaveBeenCalledWith(
          propertyId,
          { $pull: { images: imageUrl } },
          { new: true }
        );
      });
    });

    describe('addUnitImages', () => {
      it('should add images to unit', async () => {
        // Arrange
        const mockUnit = createMockUnit({
          _id: new Types.ObjectId(unitId),
          propertyId: new Types.ObjectId(propertyId),
          images: [],
        });

        mockUnitModel.findOneAndUpdate.mockResolvedValue({
          ...mockUnit,
          images: imageUrls,
        });

        // Act
        const result = await propertyService.addUnitImages(propertyId, unitId, imageUrls);

        // Assert
        expect(mockUnitModel.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: unitId, propertyId: expect.any(Types.ObjectId) },
          { $push: { images: { $each: imageUrls } } },
          { new: true }
        );
      });

      it('should throw NotFoundError when unit does not exist', async () => {
        // Arrange
        mockUnitModel.findOneAndUpdate.mockResolvedValue(null);

        // Act & Assert
        await expect(
          propertyService.addUnitImages(propertyId, unitId, imageUrls)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('deleteUnitImage', () => {
      it('should delete an image from unit', async () => {
        // Arrange
        const imageUrl = 'https://example.com/unit-image.jpg';
        const mockUnit = createMockUnit({
          _id: new Types.ObjectId(unitId),
          propertyId: new Types.ObjectId(propertyId),
        });

        mockUnitModel.findOneAndUpdate.mockResolvedValue(mockUnit);

        // Act
        const result = await propertyService.deleteUnitImage(propertyId, unitId, imageUrl);

        // Assert
        expect(mockUnitModel.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: unitId, propertyId: expect.any(Types.ObjectId) },
          { $pull: { images: imageUrl } },
          { new: true }
        );
      });
    });
  });
});
