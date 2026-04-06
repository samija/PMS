import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { ITenant, TenantStatus, ILeaseAgreement, IEmergencyContact } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult, PopulateOptions } from '../../domain/interfaces/IRepository.js';
import { ITenantRepository, TenantFilterOptions } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * Tenant filter options
 */
export { TenantFilterOptions };

/**
 * Standard populate options for tenant queries
 */
const TENANT_POPULATE_OPTIONS: PopulateOptions[] = [
  { path: 'userId', select: 'name email phone avatar' },
  { path: 'propertyId', select: 'name address' },
  { path: 'unitId', select: 'unitNumber floor type pricing' },
];

/**
 * Tenant Repository
 * Provides data access methods for Tenant entities.
 * Extends BaseRepository with tenant-specific query methods.
 */
@injectable()
export class TenantRepository extends BaseRepository<ITenant> implements ITenantRepository {
  constructor(@inject(TYPES.TenantModel) model: Model<ITenant>) {
    super(model);
  }

  /**
   * Find tenants by owner with pagination
   * @param ownerId - The owner's user ID
   * @param pagination - Pagination options
   * @param options - Optional filter options
   * @returns Paginated tenants
   */
  async findByOwnerWithPagination(
    ownerId: string | Types.ObjectId,
    pagination: PaginationOptions,
    options?: Omit<TenantFilterOptions, 'ownerId'>
  ): Promise<PaginatedResult<ITenant>> {
    const filter: FilterQuery<ITenant> = {
      ownerId: this.toObjectId(ownerId),
    };

    if (options?.propertyId) filter.propertyId = this.toObjectId(options.propertyId);
    if (options?.status) filter.status = options.status;

    return this.findWithPagination(filter, pagination, {
      sort: { createdAt: -1 },
      populate: TENANT_POPULATE_OPTIONS,
    });
  }

  /**
   * Find tenant by ID with full population
   * @param tenantId - The tenant ID
   * @param ownerId - Optional owner ID for authorization
   * @returns The tenant with populated fields or null
   */
  async findByIdWithDetails(
    tenantId: string | Types.ObjectId,
    ownerId?: string | Types.ObjectId
  ): Promise<ITenant | null> {
    const filter: FilterQuery<ITenant> = {
      _id: this.toObjectId(tenantId),
    };

    if (ownerId) {
      filter.ownerId = this.toObjectId(ownerId);
    }

    return this.model
      .findOne(filter)
      .populate(TENANT_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Find tenant by user ID
   * @param userId - The user ID
   * @param status - Optional status filter
   * @returns The tenant or null
   */
  async findByUserId(
    userId: string | Types.ObjectId,
    status?: TenantStatus
  ): Promise<ITenant | null> {
    const filter: FilterQuery<ITenant> = {
      userId: this.toObjectId(userId),
    };

    if (status) filter.status = status;

    return this.model
      .findOne(filter)
      .populate(TENANT_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Find active tenant by user ID
   * @param userId - The user ID
   * @returns The active tenant or null
   */
  async findActiveByUserId(userId: string | Types.ObjectId): Promise<ITenant | null> {
    return this.findByUserId(userId, 'active');
  }

  /**
   * Find tenants by property
   * @param propertyId - The property ID
   * @param status - Optional status filter
   * @returns Array of tenants in the property
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    status?: TenantStatus
  ): Promise<ITenant[]> {
    const filter: FilterQuery<ITenant> = {
      propertyId: this.toObjectId(propertyId),
    };

    if (status) filter.status = status;

    return this.model
      .find(filter)
      .populate(TENANT_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Find tenant by unit
   * @param unitId - The unit ID
   * @param status - Optional status filter (defaults to active)
   * @returns The tenant occupying the unit or null
   */
  async findByUnit(
    unitId: string | Types.ObjectId,
    status: TenantStatus = 'active'
  ): Promise<ITenant | null> {
    return this.model.findOne({
      unitId: this.toObjectId(unitId),
      status,
    }).populate(TENANT_POPULATE_OPTIONS).exec();
  }

  /**
   * Find tenants by owner
   * @param ownerId - The owner's user ID
   * @param status - Optional status filter
   * @returns Array of tenants belonging to the owner
   */
  async findByOwner(
    ownerId: string | Types.ObjectId,
    status?: TenantStatus
  ): Promise<ITenant[]> {
    const filter: FilterQuery<ITenant> = {
      ownerId: this.toObjectId(ownerId),
    };

    if (status) filter.status = status;

    return this.model
      .find(filter)
      .populate(TENANT_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Find active tenants by owner
   * @param ownerId - The owner's user ID
   * @returns Array of active tenants
   */
  async findActiveByOwner(ownerId: string | Types.ObjectId): Promise<ITenant[]> {
    return this.findByOwner(ownerId, 'active');
  }

  /**
   * Find tenants with expiring leases
   * @param daysUntilExpiry - Number of days until lease expiry
   * @param ownerId - Optional owner filter
   * @returns Array of tenants with soon-expiring leases
   */
  async findWithExpiringLeases(
    daysUntilExpiry: number,
    ownerId?: string | Types.ObjectId
  ): Promise<ITenant[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    const filter: FilterQuery<ITenant> = {
      status: 'active',
      'leaseAgreement.endDate': { $lte: expiryDate, $gte: new Date() },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(TENANT_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Find tenants with expired leases
   * @param ownerId - Optional owner filter
   * @returns Array of tenants with expired leases
   */
  async findWithExpiredLeases(ownerId?: string | Types.ObjectId): Promise<ITenant[]> {
    const filter: FilterQuery<ITenant> = {
      status: 'active',
      'leaseAgreement.endDate': { $lt: new Date() },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(TENANT_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Update tenant status
   * @param tenantId - The tenant ID
   * @param status - The new status
   * @returns The updated tenant or null
   */
  async updateStatus(
    tenantId: string | Types.ObjectId,
    status: TenantStatus
  ): Promise<ITenant | null> {
    return this.update(tenantId, { status });
  }

  /**
   * Terminate tenant
   * @param tenantId - The tenant ID
   * @param ownerId - The owner's user ID (for authorization)
   * @returns The updated tenant or null
   */
  async terminate(
    tenantId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId
  ): Promise<ITenant | null> {
    return this.updateOne(
      {
        _id: this.toObjectId(tenantId),
        ownerId: this.toObjectId(ownerId),
      },
      { status: 'terminated' }
    );
  }

  /**
   * Update lease agreement
   * @param tenantId - The tenant ID
   * @param leaseData - Partial lease agreement data to update
   * @returns The updated tenant or null
   */
  async updateLeaseAgreement(
    tenantId: string | Types.ObjectId,
    leaseData: Partial<ILeaseAgreement>
  ): Promise<ITenant | null> {
    const tenant = await this.findById(tenantId);
    if (!tenant) return null;

    tenant.leaseAgreement = {
      ...tenant.leaseAgreement,
      ...leaseData,
    } as ILeaseAgreement;

    return tenant.save();
  }

  /**
   * Update emergency contact
   * @param tenantId - The tenant ID
   * @param contactData - Emergency contact data
   * @returns The updated tenant or null
   */
  async updateEmergencyContact(
    tenantId: string | Types.ObjectId,
    contactData: IEmergencyContact
  ): Promise<ITenant | null> {
    return this.update(tenantId, { emergencyContact: contactData });
  }

  /**
   * Add document to tenant
   * @param tenantId - The tenant ID
   * @param documentUrl - The document URL to add
   * @returns The updated tenant or null
   */
  async addDocument(
    tenantId: string | Types.ObjectId,
    documentUrl: string
  ): Promise<ITenant | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(tenantId),
      { $push: { documents: documentUrl } },
      { new: true }
    ).exec();
  }

  /**
   * Remove document from tenant
   * @param tenantId - The tenant ID
   * @param documentUrl - The document URL to remove
   * @returns The updated tenant or null
   */
  async removeDocument(
    tenantId: string | Types.ObjectId,
    documentUrl: string
  ): Promise<ITenant | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(tenantId),
      { $pull: { documents: documentUrl } },
      { new: true }
    ).exec();
  }

  /**
   * Get tenant statistics by owner
   * @param ownerId - The owner's user ID
   * @returns Statistics object
   */
  async getStatsByOwner(ownerId: string | Types.ObjectId): Promise<{
    total: number;
    active: number;
    pending: number;
    terminated: number;
    byProperty: { propertyId: Types.ObjectId; count: number }[];
    expiringLeases: number;
  }> {
    const ownerObjectId = this.toObjectId(ownerId);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [statusCounts, byProperty, expiringLeases] = await Promise.all([
      this.aggregate<{ _id: TenantStatus; count: number }>([
        { $match: { ownerId: ownerObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { ownerId: ownerObjectId, status: 'active' } },
        { $group: { _id: '$propertyId', count: { $sum: 1 } } },
      ]),
      this.count({
        ownerId: ownerObjectId,
        status: 'active',
        'leaseAgreement.endDate': { $lte: thirtyDaysFromNow, $gte: new Date() },
      }),
    ]);

    const statusMap: Record<TenantStatus, number> = {
      active: 0,
      pending: 0,
      terminated: 0,
    };
    statusCounts.forEach((s) => { statusMap[s._id] = s.count; });

    return {
      total: statusMap.active + statusMap.pending + statusMap.terminated,
      active: statusMap.active,
      pending: statusMap.pending,
      terminated: statusMap.terminated,
      byProperty: byProperty.map((p) => ({ propertyId: p._id, count: p.count })),
      expiringLeases,
    };
  }

  /**
   * Check if user is already a tenant in a property
   * @param userId - The user ID
   * @param propertyId - The property ID
   * @param excludeTenantId - Optional tenant ID to exclude
   * @returns True if user is already a tenant, false otherwise
   */
  async isUserTenantInProperty(
    userId: string | Types.ObjectId,
    propertyId: string | Types.ObjectId,
    excludeTenantId?: string | Types.ObjectId
  ): Promise<boolean> {
    const filter: FilterQuery<ITenant> = {
      userId: this.toObjectId(userId),
      propertyId: this.toObjectId(propertyId),
      status: { $ne: 'terminated' },
    };

    if (excludeTenantId) {
      filter._id = { $ne: this.toObjectId(excludeTenantId) };
    }

    return this.exists(filter);
  }

  /**
   * Find tenant by ID and owner (for authorization)
   * @param tenantId - The tenant ID
   * @param ownerId - The owner's user ID
   * @returns The tenant or null
   */
  async findByIdAndOwner(
    tenantId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId
  ): Promise<ITenant | null> {
    return this.model.findOne({
      _id: this.toObjectId(tenantId),
      ownerId: this.toObjectId(ownerId),
    }).exec();
  }
}
