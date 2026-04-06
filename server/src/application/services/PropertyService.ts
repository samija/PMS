import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IProperty, IUnit, UserRole } from '../../types/index.js';
import { IPropertyStaff } from '../../types/index.js';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../domain/exceptions/AppError.js';
import {
  IPropertyService,
  CreatePropertyData,
  UpdatePropertyData,
  CreateUnitData,
  UpdateUnitData,
  PropertyQueryOptions,
  UnitQueryOptions,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

// Re-export interfaces for backward compatibility
export type { CreatePropertyData, UpdatePropertyData, CreateUnitData, UpdateUnitData, PropertyQueryOptions, UnitQueryOptions };

@injectable()
export class PropertyService implements IPropertyService {
  private propertyModel: Model<IProperty>;
  private unitModel: Model<IUnit>;
  private propertyStaffModel: Model<IPropertyStaff>;

  constructor(
    @inject(TYPES.PropertyModel) propertyModel: Model<IProperty>,
    @inject(TYPES.UnitModel) unitModel: Model<IUnit>,
    @inject(TYPES.PropertyStaffModel) propertyStaffModel: Model<IPropertyStaff>
  ) {
    this.propertyModel = propertyModel;
    this.unitModel = unitModel;
    this.propertyStaffModel = propertyStaffModel;
  }

  // Property Operations
  async createProperty(data: CreatePropertyData): Promise<IProperty> {
    const property = await this.propertyModel.create({
      ownerId: new Types.ObjectId(data.ownerId),
      name: data.name,
      type: data.type,
      address: data.address,
      totalFloors: data.totalFloors,
      totalUnits: data.totalUnits,
      amenities: data.amenities || [],
      description: data.description,
      waitingListType: data.waitingListType || 'both',
      images: data.images || [],
    });

    return property;
  }

  async getProperties(userId: string, userRole: UserRole, options: PropertyQueryOptions = {}) {
    const { page = 1, limit = 10, type, status } = options;

    let query: any = {};

    // Access control based on role
    if (userRole === 'admin') {
      // Admin sees all properties
    } else if (userRole === 'owner') {
      query.ownerId = new Types.ObjectId(userId);
    } else {
      // Get properties where user is staff (manager, marketing, technician)
      const staffAssignments = await this.propertyStaffModel
        .find({ userId: new Types.ObjectId(userId), isActive: true })
        .lean();

      const propertyIds = staffAssignments.map(s => s.propertyId);
      query._id = { $in: propertyIds };
    }

    if (type) query.type = type;
    if (status) query.listingStatus = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      this.propertyModel
        .find(query)
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.propertyModel.countDocuments(query),
    ]);

    return {
      properties,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getProperty(propertyId: string, userId: string): Promise<any> {
    const property = await this.propertyModel
      .findOne({ _id: propertyId, ownerId: new Types.ObjectId(userId) })
      .lean();

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    // Get units for this property
    const units = await this.unitModel.find({ propertyId: new Types.ObjectId(propertyId) }).lean();

    return {
      ...property,
      units,
    };
  }

  async updateProperty(
    propertyId: string,
    userId: string,
    data: UpdatePropertyData
  ): Promise<IProperty> {
    const property = await this.propertyModel.findOneAndUpdate(
      { _id: propertyId, ownerId: new Types.ObjectId(userId) },
      data,
      { new: true, runValidators: true }
    );

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    return property;
  }

  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    const property = await this.propertyModel.findOneAndDelete({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    // Delete associated units
    await this.unitModel.deleteMany({ propertyId: new Types.ObjectId(propertyId) });
  }

  async toggleListing(propertyId: string, userId: string): Promise<IProperty> {
    const property = await this.propertyModel.findOne({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    property.isListed = !property.isListed;
    await property.save();

    return property;
  }

  // Unit Operations
  async addUnit(data: CreateUnitData): Promise<IUnit> {
    // Verify property exists
    const property = await this.propertyModel.findById(data.propertyId);
    if (!property) {
      throw new NotFoundError('Property', data.propertyId);
    }

    // Check if unit number already exists
    const existingUnit = await this.unitModel.findOne({
      propertyId: new Types.ObjectId(data.propertyId),
      unitNumber: data.unitNumber,
    });

    if (existingUnit) {
      throw new ConflictError('Unit number already exists in this property');
    }

    // Calculate pricing
    const pricing = this.calculateUnitPricing(
      data.basePrice,
      data.floor,
      property.totalFloors,
      data.amenityCharges || 0
    );

    const unit = await this.unitModel.create({
      propertyId: new Types.ObjectId(data.propertyId),
      unitNumber: data.unitNumber,
      floor: data.floor,
      type: data.type,
      size: data.size,
      pricing,
      features: data.features || [],
      images: data.images || [],
      status: 'vacant',
    });

    return unit;
  }

  async getUnits(
    propertyId: string,
    userId: string,
    options: UnitQueryOptions = {}
  ): Promise<IUnit[]> {
    // Verify property ownership
    const property = await this.propertyModel.findOne({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    const query: any = { propertyId: new Types.ObjectId(propertyId) };
    if (options.status) query.status = options.status;
    if (options.floor !== undefined) query.floor = Number(options.floor);
    if (options.type) query.type = options.type;

    const units = await this.unitModel
      .find(query)
      .populate('currentTenantId')
      .sort({ floor: 1, unitNumber: 1 })
      .lean();

    return units;
  }

  async updateUnit(
    propertyId: string,
    unitId: string,
    userId: string,
    data: UpdateUnitData
  ): Promise<IUnit> {
    // Verify property ownership
    const property = await this.propertyModel.findOne({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    // Get current unit
    const currentUnit = await this.unitModel.findOne({
      _id: unitId,
      propertyId: new Types.ObjectId(propertyId),
    });

    if (!currentUnit) {
      throw new NotFoundError('Unit', unitId);
    }

    // Recalculate pricing if relevant fields changed
    if (data.basePrice !== undefined || data.floor !== undefined || data.amenityCharges !== undefined) {
      const floor = data.floor ?? currentUnit.floor;
      const basePrice = data.basePrice ?? currentUnit.pricing.basePrice;
      const amenityCharges = data.amenityCharges ?? currentUnit.pricing.amenityCharges;

      const pricing = this.calculateUnitPricing(
        basePrice,
        floor,
        property.totalFloors,
        amenityCharges
      );

      (data as any).pricing = pricing;
    }

    const unit = await this.unitModel.findOneAndUpdate(
      { _id: unitId, propertyId: new Types.ObjectId(propertyId) },
      data,
      { new: true, runValidators: true }
    );

    if (!unit) {
      throw new NotFoundError('Unit', unitId);
    }

    return unit;
  }

  async deleteUnit(propertyId: string, unitId: string, userId: string): Promise<void> {
    // Verify property ownership
    const property = await this.propertyModel.findOne({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    const unit = await this.unitModel.findOne({
      _id: unitId,
      propertyId: new Types.ObjectId(propertyId),
    });

    if (!unit) {
      throw new NotFoundError('Unit', unitId);
    }

    if (unit.status === 'occupied') {
      throw new BadRequestError('Cannot delete an occupied unit');
    }

    await this.unitModel.findByIdAndDelete(unitId);
  }

  // Image Management
  async addPropertyImages(propertyId: string, imageUrls: string[]): Promise<IProperty> {
    const property = await this.propertyModel.findByIdAndUpdate(
      propertyId,
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    );

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    return property;
  }

  async deletePropertyImage(propertyId: string, imageUrl: string): Promise<IProperty> {
    const property = await this.propertyModel.findByIdAndUpdate(
      propertyId,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    return property;
  }

  async addUnitImages(propertyId: string, unitId: string, imageUrls: string[]): Promise<IUnit> {
    const unit = await this.unitModel.findOneAndUpdate(
      { _id: unitId, propertyId: new Types.ObjectId(propertyId) },
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    );

    if (!unit) {
      throw new NotFoundError('Unit', unitId);
    }

    return unit;
  }

  async deleteUnitImage(propertyId: string, unitId: string, imageUrl: string): Promise<IUnit> {
    const unit = await this.unitModel.findOneAndUpdate(
      { _id: unitId, propertyId: new Types.ObjectId(propertyId) },
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!unit) {
      throw new NotFoundError('Unit', unitId);
    }

    return unit;
  }

  async setPrimaryImage(propertyId: string, userId: string, imageUrl: string): Promise<IProperty> {
    const property = await this.propertyModel.findOne({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    if (!property.images.includes(imageUrl)) {
      throw new BadRequestError('Image not found in property');
    }

    // Remove the image from its current position and add it to the front
    const filteredImages = property.images.filter(img => img !== imageUrl);
    property.images = [imageUrl, ...filteredImages];
    await property.save();

    return property;
  }

  async setUnitPrimaryImage(
    propertyId: string,
    unitId: string,
    userId: string,
    imageUrl: string
  ): Promise<IUnit> {
    // Verify property ownership
    const property = await this.propertyModel.findOne({
      _id: propertyId,
      ownerId: new Types.ObjectId(userId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    const unit = await this.unitModel.findOne({
      _id: unitId,
      propertyId: new Types.ObjectId(propertyId),
    });

    if (!unit) {
      throw new NotFoundError('Unit', unitId);
    }

    if (!unit.images.includes(imageUrl)) {
      throw new BadRequestError('Image not found in unit');
    }

    // Remove the image from its current position and add it to the front
    const filteredImages = unit.images.filter(img => img !== imageUrl);
    unit.images = [imageUrl, ...filteredImages];
    await unit.save();

    return unit;
  }

  // Helper Methods
  private calculateUnitPricing(
    basePrice: number,
    floor: number,
    totalFloors: number,
    amenityCharges: number
  ) {
    // Higher floors have higher prices (up to 10% increase for top floor)
    const floorMultiplier = 1 + (floor / totalFloors) * 0.1;
    const totalPrice = Math.round(basePrice * floorMultiplier + amenityCharges);

    return {
      basePrice,
      floorMultiplier,
      amenityCharges,
      totalPrice,
    };
  }
}
