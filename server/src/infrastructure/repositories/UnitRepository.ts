import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IUnit, UnitType, UnitStatus, IPricing } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import { IUnitRepository, UnitFilterOptions } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * Unit filter options
 */
export { UnitFilterOptions };

/**
 * Unit Repository
 * Provides data access methods for Unit entities.
 * Extends BaseRepository with unit-specific query methods.
 */
@injectable()
export class UnitRepository extends BaseRepository<IUnit> implements IUnitRepository {
  constructor(@inject(TYPES.UnitModel) model: Model<IUnit>) {
    super(model);
  }

  /**
   * Find units by property ID
   * @param propertyId - The property ID
   * @param options - Optional filter options
   * @returns Array of units belonging to the property
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    options?: Omit<UnitFilterOptions, 'propertyId'>
  ): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = {
      propertyId: this.toObjectId(propertyId),
    };

    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;
    if (options?.floor !== undefined) filter.floor = options.floor;
    if (options?.minPrice || options?.maxPrice) {
      filter['pricing.totalPrice'] = {};
      if (options.minPrice) filter['pricing.totalPrice'].$gte = options.minPrice;
      if (options.maxPrice) filter['pricing.totalPrice'].$lte = options.maxPrice;
    }

    return this.model
      .find(filter)
      .populate('currentTenantId')
      .sort({ floor: 1, unitNumber: 1 })
      .exec();
  }

  /**
   * Find unit by property and unit number (unique combination)
   * @param propertyId - The property ID
   * @param unitNumber - The unit number
   * @returns The unit or null if not found
   */
  async findByPropertyAndUnitNumber(
    propertyId: string | Types.ObjectId,
    unitNumber: string
  ): Promise<IUnit | null> {
    return this.model.findOne({
      propertyId: this.toObjectId(propertyId),
      unitNumber,
    }).exec();
  }

  /**
   * Find vacant units
   * @param propertyId - Optional property filter
   * @returns Array of vacant units
   */
  async findVacant(propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { status: 'vacant' };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).exec();
  }

  /**
   * Find occupied units
   * @param propertyId - Optional property filter
   * @returns Array of occupied units
   */
  async findOccupied(propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { status: 'occupied' };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).populate('currentTenantId').exec();
  }

  /**
   * Find reserved units
   * @param propertyId - Optional property filter
   * @returns Array of reserved units
   */
  async findReserved(propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { status: 'reserved' };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).exec();
  }

  /**
   * Find units under maintenance
   * @param propertyId - Optional property filter
   * @returns Array of units under maintenance
   */
  async findUnderMaintenance(propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { status: 'maintenance' };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).exec();
  }

  /**
   * Find units by status
   * @param status - The unit status
   * @param propertyId - Optional property filter
   * @returns Array of units with the specified status
   */
  async findByStatus(status: UnitStatus, propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { status };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).exec();
  }

  /**
   * Find units by type
   * @param type - The unit type
   * @param propertyId - Optional property filter
   * @returns Array of units of the specified type
   */
  async findByType(type: UnitType, propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { type };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).exec();
  }

  /**
   * Find units by floor
   * @param floor - The floor number
   * @param propertyId - Optional property filter
   * @returns Array of units on the specified floor
   */
  async findByFloor(floor: number, propertyId?: string | Types.ObjectId): Promise<IUnit[]> {
    const filter: FilterQuery<IUnit> = { floor };
    if (propertyId) filter.propertyId = this.toObjectId(propertyId);
    return this.model.find(filter).sort({ unitNumber: 1 }).exec();
  }

  /**
   * Find units by current tenant
   * @param tenantId - The tenant ID
   * @returns The unit occupied by the tenant or null
   */
  async findByTenant(tenantId: string | Types.ObjectId): Promise<IUnit | null> {
    return this.model.findOne({
      currentTenantId: this.toObjectId(tenantId),
    }).exec();
  }

  /**
   * Find units with expiring leases
   * @param daysUntilExpiry - Number of days until lease expiry
   * @param propertyId - Optional property filter
   * @returns Array of units with soon-expiring leases
   */
  async findWithExpiringLeases(
    daysUntilExpiry: number,
    propertyId?: string | Types.ObjectId
  ): Promise<IUnit[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    const filter: FilterQuery<IUnit> = {
      status: 'occupied',
      leaseEnd: { $lte: expiryDate, $gte: new Date() },
    };

    if (propertyId) filter.propertyId = this.toObjectId(propertyId);

    return this.model.find(filter).populate('currentTenantId').exec();
  }

  /**
   * Update unit status
   * @param unitId - The unit ID
   * @param status - The new status
   * @returns The updated unit or null
   */
  async updateStatus(
    unitId: string | Types.ObjectId,
    status: UnitStatus
  ): Promise<IUnit | null> {
    return this.update(unitId, { status });
  }

  /**
   * Update unit pricing
   * @param unitId - The unit ID
   * @param pricing - The new pricing object
   * @returns The updated unit or null
   */
  async updatePricing(
    unitId: string | Types.ObjectId,
    pricing: IPricing
  ): Promise<IUnit | null> {
    return this.update(unitId, { pricing });
  }

  /**
   * Assign tenant to unit
   * @param unitId - The unit ID
   * @param tenantId - The tenant ID
   * @param leaseStart - Lease start date
   * @param leaseEnd - Lease end date
   * @returns The updated unit or null
   */
  async assignTenant(
    unitId: string | Types.ObjectId,
    tenantId: string | Types.ObjectId,
    leaseStart: Date,
    leaseEnd: Date
  ): Promise<IUnit | null> {
    return this.update(unitId, {
      currentTenantId: this.toObjectId(tenantId),
      status: 'occupied',
      leaseStart,
      leaseEnd,
    });
  }

  /**
   * Remove tenant from unit (make vacant)
   * @param unitId - The unit ID
   * @returns The updated unit or null
   */
  async removeTenant(unitId: string | Types.ObjectId): Promise<IUnit | null> {
    return this.update(unitId, {
      $unset: { currentTenantId: 1, leaseStart: 1, leaseEnd: 1 },
      status: 'vacant',
    } as any);
  }

  /**
   * Add images to unit
   * @param unitId - The unit ID
   * @param imageUrls - Array of image URLs to add
   * @returns The updated unit or null
   */
  async addImages(
    unitId: string | Types.ObjectId,
    imageUrls: string[]
  ): Promise<IUnit | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(unitId),
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    ).exec();
  }

  /**
   * Remove image from unit
   * @param unitId - The unit ID
   * @param imageUrl - The image URL to remove
   * @returns The updated unit or null
   */
  async removeImage(
    unitId: string | Types.ObjectId,
    imageUrl: string
  ): Promise<IUnit | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(unitId),
      { $pull: { images: imageUrl } },
      { new: true }
    ).exec();
  }

  /**
   * Update features
   * @param unitId - The unit ID
   * @param features - The new features array
   * @returns The updated unit or null
   */
  async updateFeatures(
    unitId: string | Types.ObjectId,
    features: string[]
  ): Promise<IUnit | null> {
    return this.update(unitId, { features });
  }

  /**
   * Get unit statistics by property
   * @param propertyId - The property ID
   * @returns Statistics object
   */
  async getStatsByProperty(propertyId: string | Types.ObjectId): Promise<{
    total: number;
    byStatus: Record<UnitStatus, number>;
    byType: Record<string, number>;
    byFloor: Record<number, number>;
    averagePrice: number;
    occupancyRate: number;
  }> {
    const propertyObjectId = this.toObjectId(propertyId);

    const [total, byStatus, byType, byFloor, priceAgg] = await Promise.all([
      this.count({ propertyId: propertyObjectId }),
      this.aggregate<{ _id: UnitStatus; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: string; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: number; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$floor', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ avgPrice: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: null, avgPrice: { $avg: '$pricing.totalPrice' } } },
      ]),
    ]);

    const statusMap: Record<UnitStatus, number> = {
      vacant: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
    };
    byStatus.forEach((s) => { statusMap[s._id] = s.count; });

    const occupiedCount = statusMap.occupied;
    const occupancyRate = total > 0 ? (occupiedCount / total) * 100 : 0;

    return {
      total,
      byStatus: statusMap,
      byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byFloor: byFloor.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      averagePrice: priceAgg[0]?.avgPrice || 0,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }

  /**
   * Delete all units by property
   * @param propertyId - The property ID
   * @returns Number of deleted units
   */
  async deleteByProperty(propertyId: string | Types.ObjectId): Promise<number> {
    return this.deleteMany({ propertyId: this.toObjectId(propertyId) });
  }

  /**
   * Check if unit number exists in property
   * @param propertyId - The property ID
   * @param unitNumber - The unit number
   * @param excludeUnitId - Optional unit ID to exclude (for updates)
   * @returns True if unit number exists, false otherwise
   */
  async unitNumberExists(
    propertyId: string | Types.ObjectId,
    unitNumber: string,
    excludeUnitId?: string | Types.ObjectId
  ): Promise<boolean> {
    const filter: FilterQuery<IUnit> = {
      propertyId: this.toObjectId(propertyId),
      unitNumber,
    };

    if (excludeUnitId) {
      filter._id = { $ne: this.toObjectId(excludeUnitId) };
    }

    return this.exists(filter);
  }
}
