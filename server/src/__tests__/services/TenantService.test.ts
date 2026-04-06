/**
 * TenantService Unit Tests
 *
 * Tests for the TenantService which handles tenant management.
 */

import { Types } from 'mongoose';
import { TenantService } from '../../application/services/TenantService';
import {
  createMockUser,
  createMockUserModel,
  createMockProperty,
  createMockPropertyModel,
  createMockUnit,
  createMockUnitModel,
  createMockTenant,
  createMockTenantModel,
  createChainableQuery,
} from '../mocks/repositories';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError';

describe('TenantService', () => {
  let tenantService: TenantService;
  let mockUserModel: ReturnType<typeof createMockUserModel>;
  let mockPropertyModel: ReturnType<typeof createMockPropertyModel>;
  let mockUnitModel: ReturnType<typeof createMockUnitModel>;
  let mockTenantModel: ReturnType<typeof createMockTenantModel>;

  beforeEach(() => {
    mockUserModel = createMockUserModel();
    mockPropertyModel = createMockPropertyModel();
    mockUnitModel = createMockUnitModel();
    mockTenantModel = createMockTenantModel();

    tenantService = new TenantService(
      mockUserModel as any,
      mockTenantModel as any,
      mockUnitModel as any,
      mockPropertyModel as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    const propertyId = new Types.ObjectId().toString();
    const unitId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();

    const createTenantData = {
      email: 'tenant@example.com',
      name: 'Test Tenant',
      phone: '+1234567890',
      propertyId,
      unitId,
      ownerId,
      leaseAgreement: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        monthlyRent: 15000,
        deposit: 30000,
        terms: 'Standard lease terms',
      },
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+9876543210',
        relationship: 'Spouse',
      },
    };

    it('should successfully create a tenant with new user', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(ownerId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'vacant',
      });
      const mockNewUser = createMockUser({
        email: createTenantData.email,
        name: createTenantData.name,
        role: 'tenant',
      });
      const mockCreatedTenant = createMockTenant({
        userId: mockNewUser._id,
        propertyId: new Types.ObjectId(propertyId),
        unitId: new Types.ObjectId(unitId),
        ownerId: new Types.ObjectId(ownerId),
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);
      mockUserModel.findOne.mockResolvedValue(null); // No existing user
      mockUserModel.create.mockResolvedValue(mockNewUser);
      mockTenantModel.create.mockResolvedValue(mockCreatedTenant);
      mockUnitModel.findByIdAndUpdate.mockResolvedValue(mockUnit);

      // Act
      const result = await tenantService.createTenant(createTenantData);

      // Assert
      expect(mockPropertyModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        ownerId: expect.any(Types.ObjectId),
      });
      expect(mockUnitModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        propertyId: expect.any(Types.ObjectId),
      });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: createTenantData.email,
        name: createTenantData.name,
        phone: createTenantData.phone,
        role: 'tenant',
        authProvider: 'local',
        isVerified: false,
      });
      expect(mockTenantModel.create).toHaveBeenCalled();
      expect(mockUnitModel.findByIdAndUpdate).toHaveBeenCalledWith(
        unitId,
        expect.objectContaining({
          status: 'occupied',
          currentTenantId: expect.any(Types.ObjectId),
        })
      );
    });

    it('should create tenant using existing user', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(ownerId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'vacant',
      });
      const existingUser = createMockUser({
        email: createTenantData.email,
        name: 'Existing User',
      });
      const mockCreatedTenant = createMockTenant({
        userId: existingUser._id,
        propertyId: new Types.ObjectId(propertyId),
        unitId: new Types.ObjectId(unitId),
        ownerId: new Types.ObjectId(ownerId),
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);
      mockUserModel.findOne.mockResolvedValue(existingUser);
      mockTenantModel.create.mockResolvedValue(mockCreatedTenant);
      mockUnitModel.findByIdAndUpdate.mockResolvedValue(mockUnit);

      // Act
      const result = await tenantService.createTenant(createTenantData);

      // Assert
      expect(mockUserModel.create).not.toHaveBeenCalled();
      expect(mockTenantModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: existingUser._id,
        })
      );
    });

    it('should create tenant for reserved unit', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(ownerId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'reserved',
      });
      const mockNewUser = createMockUser({ email: createTenantData.email });
      const mockCreatedTenant = createMockTenant();

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockNewUser);
      mockTenantModel.create.mockResolvedValue(mockCreatedTenant);
      mockUnitModel.findByIdAndUpdate.mockResolvedValue(mockUnit);

      // Act
      const result = await tenantService.createTenant(createTenantData);

      // Assert
      expect(result).toBeDefined();
    });

    it('should throw NotFoundError when property does not exist', async () => {
      // Arrange
      mockPropertyModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(NotFoundError);
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(
        'Property with ID'
      );
    });

    it('should throw NotFoundError when unit does not exist', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(ownerId),
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(NotFoundError);
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow('Unit with ID');
    });

    it('should throw BadRequestError when unit is already occupied', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(ownerId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'occupied',
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);

      // Act & Assert
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(BadRequestError);
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(
        'Unit is not available'
      );
    });

    it('should throw BadRequestError when unit is under maintenance', async () => {
      // Arrange
      const mockProperty = createMockProperty({
        _id: new Types.ObjectId(propertyId),
        ownerId: new Types.ObjectId(ownerId),
      });
      const mockUnit = createMockUnit({
        _id: new Types.ObjectId(unitId),
        propertyId: new Types.ObjectId(propertyId),
        status: 'maintenance',
      });

      mockPropertyModel.findOne.mockResolvedValue(mockProperty);
      mockUnitModel.findOne.mockResolvedValue(mockUnit);

      // Act & Assert
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(BadRequestError);
      await expect(tenantService.createTenant(createTenantData)).rejects.toThrow(
        'Unit is not available'
      );
    });
  });

  describe('getTenants', () => {
    const ownerId = new Types.ObjectId().toString();

    it('should return paginated tenants for owner', async () => {
      // Arrange
      const mockTenants = [
        createMockTenant({ ownerId: new Types.ObjectId(ownerId), status: 'active' }),
        createMockTenant({ ownerId: new Types.ObjectId(ownerId), status: 'active' }),
      ];

      const chainableQuery = createChainableQuery(mockTenants);
      mockTenantModel.find.mockReturnValue(chainableQuery);
      mockTenantModel.countDocuments.mockResolvedValue(2);

      // Act
      const result = await tenantService.getTenants(ownerId, { page: 1, limit: 10 });

      // Assert
      expect(mockTenantModel.find).toHaveBeenCalledWith({
        ownerId: expect.any(Types.ObjectId),
      });
      expect(result).toHaveProperty('tenants');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination.total).toBe(2);
    });

    it('should filter tenants by status', async () => {
      // Arrange
      const mockTenants = [
        createMockTenant({ ownerId: new Types.ObjectId(ownerId), status: 'active' }),
      ];

      const chainableQuery = createChainableQuery(mockTenants);
      mockTenantModel.find.mockReturnValue(chainableQuery);
      mockTenantModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await tenantService.getTenants(ownerId, {
        page: 1,
        limit: 10,
        status: 'active',
      });

      // Assert
      expect(mockTenantModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });

    it('should filter tenants by property', async () => {
      // Arrange
      const propertyId = new Types.ObjectId().toString();
      const mockTenants = [createMockTenant({ propertyId: new Types.ObjectId(propertyId) })];

      const chainableQuery = createChainableQuery(mockTenants);
      mockTenantModel.find.mockReturnValue(chainableQuery);
      mockTenantModel.countDocuments.mockResolvedValue(1);

      // Act
      const result = await tenantService.getTenants(ownerId, {
        page: 1,
        limit: 10,
        propertyId,
      });

      // Assert
      expect(mockTenantModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: expect.any(Types.ObjectId) })
      );
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const mockTenants = [createMockTenant()];

      const chainableQuery = createChainableQuery(mockTenants);
      mockTenantModel.find.mockReturnValue(chainableQuery);
      mockTenantModel.countDocuments.mockResolvedValue(25);

      // Act
      const result = await tenantService.getTenants(ownerId, { page: 3, limit: 10 });

      // Assert
      expect(chainableQuery.skip).toHaveBeenCalledWith(20); // (page 3 - 1) * 10
      expect(chainableQuery.limit).toHaveBeenCalledWith(10);
      expect(result.pagination.pages).toBe(3);
    });
  });

  describe('getTenant', () => {
    const tenantId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();

    it('should return a single tenant with populated fields', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      });

      const chainableQuery = createChainableQuery(mockTenant);
      mockTenantModel.findOne.mockReturnValue(chainableQuery);

      // Act
      const result = await tenantService.getTenant(tenantId, ownerId);

      // Assert
      expect(mockTenantModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        ownerId: expect.any(Types.ObjectId),
      });
      expect(chainableQuery.populate).toHaveBeenCalled();
    });

    it('should throw NotFoundError when tenant does not exist', async () => {
      // Arrange
      const chainableQuery = createChainableQuery(null);
      mockTenantModel.findOne.mockReturnValue(chainableQuery);

      // Act & Assert
      await expect(tenantService.getTenant(tenantId, ownerId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTenant', () => {
    const tenantId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();

    it('should successfully update tenant lease agreement', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      });

      mockTenantModel.findOne.mockResolvedValue(mockTenant);
      mockUnitModel.findByIdAndUpdate.mockResolvedValue({});

      const updateData = {
        leaseAgreement: {
          monthlyRent: 18000,
        },
      };

      // Act
      const result = await tenantService.updateTenant(tenantId, ownerId, updateData);

      // Assert
      expect(mockTenant.save).toHaveBeenCalled();
    });

    it('should update emergency contact', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      });

      mockTenantModel.findOne.mockResolvedValue(mockTenant);

      const updateData = {
        emergencyContact: {
          name: 'New Emergency Contact',
          phone: '+9999999999',
          relationship: 'Parent',
        },
      };

      // Act
      await tenantService.updateTenant(tenantId, ownerId, updateData);

      // Assert
      expect(mockTenant.emergencyContact).toEqual(updateData.emergencyContact);
      expect(mockTenant.save).toHaveBeenCalled();
    });

    it('should update tenant status', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
        status: 'active',
      });

      mockTenantModel.findOne.mockResolvedValue(mockTenant);

      const updateData = {
        status: 'pending',
      };

      // Act
      await tenantService.updateTenant(tenantId, ownerId, updateData);

      // Assert
      expect(mockTenant.status).toBe('pending');
      expect(mockTenant.save).toHaveBeenCalled();
    });

    it('should update unit lease dates when lease agreement changes', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      });

      mockTenantModel.findOne.mockResolvedValue(mockTenant);
      mockUnitModel.findByIdAndUpdate.mockResolvedValue({});

      const updateData = {
        leaseAgreement: {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      };

      // Act
      await tenantService.updateTenant(tenantId, ownerId, updateData);

      // Assert
      expect(mockUnitModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockTenant.unitId,
        expect.objectContaining({
          leaseStart: expect.any(Date),
          leaseEnd: expect.any(Date),
        })
      );
    });

    it('should throw NotFoundError when tenant does not exist', async () => {
      // Arrange
      mockTenantModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        tenantService.updateTenant(tenantId, ownerId, { status: 'active' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('terminateTenant', () => {
    const tenantId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();

    it('should successfully terminate tenant and free unit', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
        status: 'active',
      });

      mockTenantModel.findOne.mockResolvedValue(mockTenant);
      mockUnitModel.findByIdAndUpdate.mockResolvedValue({});

      // Act
      const result = await tenantService.terminateTenant(tenantId, ownerId);

      // Assert
      expect(mockTenant.status).toBe('terminated');
      expect(mockTenant.save).toHaveBeenCalled();
      expect(mockUnitModel.findByIdAndUpdate).toHaveBeenCalledWith(mockTenant.unitId, {
        status: 'vacant',
        currentTenantId: null,
        leaseStart: null,
        leaseEnd: null,
      });
    });

    it('should throw NotFoundError when tenant does not exist', async () => {
      // Arrange
      mockTenantModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(tenantService.terminateTenant(tenantId, ownerId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMyTenancy', () => {
    const userId = new Types.ObjectId().toString();

    it('should return active tenancy for user', async () => {
      // Arrange
      const mockTenant = createMockTenant({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      const chainableQuery = createChainableQuery(mockTenant);
      mockTenantModel.findOne.mockReturnValue(chainableQuery);

      // Act
      const result = await tenantService.getMyTenancy(userId);

      // Assert
      expect(mockTenantModel.findOne).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
        status: 'active',
      });
      expect(chainableQuery.populate).toHaveBeenCalledTimes(3); // propertyId, unitId, ownerId
    });

    it('should throw NotFoundError when no active tenancy exists', async () => {
      // Arrange
      const chainableQuery = createChainableQuery(null);
      mockTenantModel.findOne.mockReturnValue(chainableQuery);

      // Act & Assert
      await expect(tenantService.getMyTenancy(userId)).rejects.toThrow(NotFoundError);
      await expect(tenantService.getMyTenancy(userId)).rejects.toThrow('Active tenancy not found');
    });
  });
});
