import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import {
  IMaintenance,
  MaintenanceStatus,
  MaintenanceCategory,
  MaintenancePriority,
  ITimelineEntry,
} from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult, PopulateOptions } from '../../domain/interfaces/IRepository.js';
import { IMaintenanceRepository, MaintenanceFilterOptions } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * Maintenance filter options
 */
export { MaintenanceFilterOptions };

/**
 * Standard populate options for maintenance queries
 */
const MAINTENANCE_POPULATE_OPTIONS: PopulateOptions[] = [
  { path: 'propertyId', select: 'name address' },
  { path: 'unitId', select: 'unitNumber floor' },
  { path: 'tenantId' },
  { path: 'assignedTo', select: 'name phone' },
];

/**
 * Full populate options including timeline
 */
const MAINTENANCE_FULL_POPULATE_OPTIONS: PopulateOptions[] = [
  ...MAINTENANCE_POPULATE_OPTIONS,
  { path: 'timeline.updatedBy', select: 'name' },
];

/**
 * Maintenance Repository
 * Provides data access methods for Maintenance entities.
 * Extends BaseRepository with maintenance-specific query methods.
 */
@injectable()
export class MaintenanceRepository extends BaseRepository<IMaintenance> implements IMaintenanceRepository {
  constructor(@inject(TYPES.MaintenanceModel) model: Model<IMaintenance>) {
    super(model);
  }

  /**
   * Find maintenance requests with pagination and filtering
   * @param filter - Maintenance filter options
   * @param pagination - Pagination options
   * @returns Paginated maintenance requests
   */
  async findWithFilters(
    filter: MaintenanceFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IMaintenance>> {
    const query: FilterQuery<IMaintenance> = {};

    if (filter.ownerId) query.ownerId = this.toObjectId(filter.ownerId);
    if (filter.tenantId) query.tenantId = this.toObjectId(filter.tenantId);
    if (filter.propertyId) query.propertyId = this.toObjectId(filter.propertyId);
    if (filter.unitId) query.unitId = this.toObjectId(filter.unitId);
    if (filter.assignedTo) query.assignedTo = this.toObjectId(filter.assignedTo);
    if (filter.status) query.status = filter.status;
    if (filter.category) query.category = filter.category;
    if (filter.priority) query.priority = filter.priority;

    return this.findWithPagination(query, pagination, {
      sort: { createdAt: -1 },
      populate: MAINTENANCE_POPULATE_OPTIONS,
    });
  }

  /**
   * Find maintenance request by ID with full details
   * @param requestId - The maintenance request ID
   * @returns The maintenance request with populated fields or null
   */
  async findByIdWithDetails(requestId: string | Types.ObjectId): Promise<IMaintenance | null> {
    return this.model
      .findById(this.toObjectId(requestId))
      .populate(MAINTENANCE_FULL_POPULATE_OPTIONS)
      .exec();
  }

  /**
   * Find maintenance requests by owner
   * @param ownerId - The owner's user ID
   * @param options - Optional filter options
   * @returns Array of maintenance requests
   */
  async findByOwner(
    ownerId: string | Types.ObjectId,
    options?: Omit<MaintenanceFilterOptions, 'ownerId'>
  ): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      ownerId: this.toObjectId(ownerId),
    };

    if (options?.status) filter.status = options.status;
    if (options?.priority) filter.priority = options.priority;
    if (options?.category) filter.category = options.category;
    if (options?.propertyId) filter.propertyId = this.toObjectId(options.propertyId);

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find maintenance requests by tenant
   * @param tenantId - The tenant ID
   * @param options - Optional filter options
   * @returns Array of maintenance requests
   */
  async findByTenant(
    tenantId: string | Types.ObjectId,
    options?: Omit<MaintenanceFilterOptions, 'tenantId'>
  ): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      tenantId: this.toObjectId(tenantId),
    };

    if (options?.status) filter.status = options.status;

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find maintenance requests assigned to technician
   * @param technicianId - The technician's user ID
   * @param status - Optional status filter
   * @returns Array of assigned maintenance requests
   */
  async findByTechnician(
    technicianId: string | Types.ObjectId,
    status?: MaintenanceStatus
  ): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      assignedTo: this.toObjectId(technicianId),
    };

    if (status) filter.status = status;

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }

  /**
   * Find maintenance requests by property
   * @param propertyId - The property ID
   * @param options - Optional filter options
   * @returns Array of maintenance requests
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    options?: Omit<MaintenanceFilterOptions, 'propertyId'>
  ): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      propertyId: this.toObjectId(propertyId),
    };

    if (options?.status) filter.status = options.status;
    if (options?.priority) filter.priority = options.priority;

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find active (non-completed/cancelled) maintenance requests
   * @param ownerId - Optional owner filter
   * @returns Array of active maintenance requests
   */
  async findActive(ownerId?: string | Types.ObjectId): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      status: { $nin: ['completed', 'cancelled'] },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }

  /**
   * Find emergency maintenance requests
   * @param ownerId - Optional owner filter
   * @returns Array of emergency maintenance requests
   */
  async findEmergency(ownerId?: string | Types.ObjectId): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      priority: 'emergency',
      status: { $nin: ['completed', 'cancelled'] },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Find unassigned maintenance requests
   * @param ownerId - Optional owner filter
   * @returns Array of unassigned maintenance requests
   */
  async findUnassigned(ownerId?: string | Types.ObjectId): Promise<IMaintenance[]> {
    const filter: FilterQuery<IMaintenance> = {
      assignedTo: { $exists: false },
      status: { $nin: ['completed', 'cancelled'] },
    };

    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    return this.model
      .find(filter)
      .populate(MAINTENANCE_POPULATE_OPTIONS)
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }

  /**
   * Update maintenance status
   * @param requestId - The maintenance request ID
   * @param status - The new status
   * @param updatedBy - The user making the update
   * @param note - Optional status note
   * @returns The updated maintenance request or null
   */
  async updateStatus(
    requestId: string | Types.ObjectId,
    status: MaintenanceStatus,
    updatedBy: string | Types.ObjectId,
    note?: string
  ): Promise<IMaintenance | null> {
    const request = await this.findById(requestId);
    if (!request) return null;

    request.status = status;

    // Add timeline entry
    request.timeline.push({
      status,
      timestamp: new Date(),
      note,
      updatedBy: this.toObjectId(updatedBy),
    } as ITimelineEntry);

    // Set completion timestamp if completed
    if (status === 'completed') {
      request.completedAt = new Date();
    }

    return request.save();
  }

  /**
   * Assign technician to maintenance request
   * @param requestId - The maintenance request ID
   * @param technicianId - The technician's user ID
   * @param assignedBy - The user making the assignment
   * @param options - Optional assignment options
   * @returns The updated maintenance request or null
   */
  async assignTechnician(
    requestId: string | Types.ObjectId,
    technicianId: string | Types.ObjectId,
    assignedBy: string | Types.ObjectId,
    options?: {
      scheduledDate?: Date;
      estimatedCost?: number;
      note?: string;
    }
  ): Promise<IMaintenance | null> {
    const request = await this.findById(requestId);
    if (!request) return null;

    request.assignedTo = this.toObjectId(technicianId);
    request.status = 'assigned';

    if (options?.scheduledDate) {
      request.scheduledDate = options.scheduledDate;
    }

    if (options?.estimatedCost !== undefined) {
      request.estimatedCost = options.estimatedCost;
    }

    // Add timeline entry
    request.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      note: options?.note || 'Assigned to technician',
      updatedBy: this.toObjectId(assignedBy),
    } as ITimelineEntry);

    return request.save();
  }

  /**
   * Complete maintenance request
   * @param requestId - The maintenance request ID
   * @param completedBy - The user completing the request
   * @param options - Completion options
   * @returns The updated maintenance request or null
   */
  async complete(
    requestId: string | Types.ObjectId,
    completedBy: string | Types.ObjectId,
    options?: {
      actualCost?: number;
      completionImages?: string[];
      note?: string;
    }
  ): Promise<IMaintenance | null> {
    const request = await this.findById(requestId);
    if (!request) return null;

    request.status = 'completed';
    request.completedAt = new Date();

    if (options?.actualCost !== undefined) {
      request.actualCost = options.actualCost;
    }

    if (options?.completionImages) {
      request.completionImages = options.completionImages;
    }

    // Add timeline entry
    request.timeline.push({
      status: 'completed',
      timestamp: new Date(),
      note: options?.note || 'Work completed',
      updatedBy: this.toObjectId(completedBy),
    } as ITimelineEntry);

    return request.save();
  }

  /**
   * Submit tenant feedback
   * @param requestId - The maintenance request ID
   * @param tenantId - The tenant ID (for verification)
   * @param rating - Rating (1-5)
   * @param feedback - Optional feedback text
   * @returns The updated maintenance request or null
   */
  async submitFeedback(
    requestId: string | Types.ObjectId,
    tenantId: string | Types.ObjectId,
    rating: number,
    feedback?: string
  ): Promise<IMaintenance | null> {
    return this.updateOne(
      {
        _id: this.toObjectId(requestId),
        tenantId: this.toObjectId(tenantId),
        status: 'completed',
      },
      {
        tenantRating: rating,
        tenantFeedback: feedback,
      }
    );
  }

  /**
   * Add images to maintenance request
   * @param requestId - The maintenance request ID
   * @param imageUrls - Array of image URLs to add
   * @returns The updated maintenance request or null
   */
  async addImages(
    requestId: string | Types.ObjectId,
    imageUrls: string[]
  ): Promise<IMaintenance | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(requestId),
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    ).exec();
  }

  /**
   * Add completion images
   * @param requestId - The maintenance request ID
   * @param imageUrls - Array of completion image URLs
   * @returns The updated maintenance request or null
   */
  async addCompletionImages(
    requestId: string | Types.ObjectId,
    imageUrls: string[]
  ): Promise<IMaintenance | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(requestId),
      { $push: { completionImages: { $each: imageUrls } } },
      { new: true }
    ).exec();
  }

  /**
   * Find maintenance request by ID and owner (for authorization)
   * @param requestId - The maintenance request ID
   * @param ownerId - The owner's user ID
   * @returns The maintenance request or null
   */
  async findByIdAndOwner(
    requestId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId
  ): Promise<IMaintenance | null> {
    return this.model.findOne({
      _id: this.toObjectId(requestId),
      ownerId: this.toObjectId(ownerId),
    }).exec();
  }

  /**
   * Get maintenance statistics by owner
   * @param ownerId - The owner's user ID
   * @returns Statistics object
   */
  async getStatsByOwner(ownerId: string | Types.ObjectId): Promise<{
    byStatus: { status: MaintenanceStatus; count: number }[];
    byPriority: { priority: MaintenancePriority; count: number }[];
    byCategory: { category: MaintenanceCategory; count: number; totalCost: number }[];
    averageResolutionTime: number;
    averageRating: number;
  }> {
    const ownerObjectId = this.toObjectId(ownerId);

    const [byStatus, byPriority, byCategory, resolutionTime, rating] = await Promise.all([
      this.aggregate<{ _id: MaintenanceStatus; count: number }>([
        { $match: { ownerId: ownerObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: MaintenancePriority; count: number }>([
        {
          $match: {
            ownerId: ownerObjectId,
            status: { $nin: ['completed', 'cancelled'] },
          },
        },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: MaintenanceCategory; count: number; totalCost: number }>([
        { $match: { ownerId: ownerObjectId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalCost: { $sum: '$actualCost' },
          },
        },
      ]),
      this.aggregate<{ avgTime: number }>([
        {
          $match: {
            ownerId: ownerObjectId,
            status: 'completed',
            completedAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionTime: { $subtract: ['$completedAt', '$createdAt'] },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$resolutionTime' },
          },
        },
      ]),
      this.aggregate<{ avgRating: number }>([
        {
          $match: {
            ownerId: ownerObjectId,
            tenantRating: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$tenantRating' },
          },
        },
      ]),
    ]);

    // Convert resolution time from milliseconds to hours
    const avgResolutionHours = resolutionTime[0]
      ? resolutionTime[0].avgTime / (1000 * 60 * 60)
      : 0;

    return {
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      byPriority: byPriority.map((p) => ({ priority: p._id, count: p.count })),
      byCategory: byCategory.map((c) => ({
        category: c._id,
        count: c.count,
        totalCost: c.totalCost || 0,
      })),
      averageResolutionTime: Math.round(avgResolutionHours * 100) / 100,
      averageRating: Math.round((rating[0]?.avgRating || 0) * 100) / 100,
    };
  }
}
