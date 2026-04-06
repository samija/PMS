import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IWaitingList, WaitingListStatus, IApplication } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult, PopulateOptions } from '../../domain/interfaces/IRepository.js';
import { IWaitingListRepository, WaitingListFilterOptions } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * Waiting list filter options
 */
export { WaitingListFilterOptions };

/**
 * Standard populate options for waiting list queries
 */
const WAITING_LIST_POPULATE_OPTIONS: PopulateOptions[] = [
  { path: 'propertyId', select: 'name address' },
  { path: 'unitId', select: 'unitNumber floor type pricing' },
  { path: 'applicantId', select: 'name email phone' },
];

/**
 * Waiting List Repository
 * Provides data access methods for WaitingList entities.
 * Extends BaseRepository with waiting list-specific query methods.
 */
@injectable()
export class WaitingListRepository extends BaseRepository<IWaitingList> implements IWaitingListRepository {
  constructor(@inject(TYPES.WaitingListModel) model: Model<IWaitingList>) {
    super(model);
  }

  /**
   * Find waiting list entries with pagination and filtering
   * @param filter - Waiting list filter options
   * @param pagination - Pagination options
   * @returns Paginated waiting list entries
   */
  async findWithFilters(
    filter: WaitingListFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IWaitingList>> {
    const query: FilterQuery<IWaitingList> = {};

    if (filter.propertyId) query.propertyId = this.toObjectId(filter.propertyId);
    if (filter.unitId) query.unitId = this.toObjectId(filter.unitId);
    if (filter.applicantId) query.applicantId = this.toObjectId(filter.applicantId);
    if (filter.status) query.status = filter.status;
    if (filter.type) query.type = filter.type;

    return this.findWithPagination(query, pagination, {
      sort: { position: 1, appliedAt: 1 },
      populate: WAITING_LIST_POPULATE_OPTIONS,
    });
  }

  /**
   * Find waiting list entries by property
   * @param propertyId - The property ID
   * @param options - Optional filter options
   * @returns Array of waiting list entries
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    options?: Omit<WaitingListFilterOptions, 'propertyId'>
  ): Promise<IWaitingList[]> {
    const filter: FilterQuery<IWaitingList> = {
      propertyId: this.toObjectId(propertyId),
    };

    if (options?.unitId) filter.unitId = this.toObjectId(options.unitId);
    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;

    return this.model
      .find(filter)
      .populate(WAITING_LIST_POPULATE_OPTIONS)
      .sort({ position: 1, appliedAt: 1 })
      .exec();
  }

  /**
   * Find waiting list entries by owner (across all their properties)
   * @param ownerId - The owner's user ID
   * @param propertyIds - Array of property IDs owned by the user
   * @param options - Optional filter options
   * @returns Array of waiting list entries
   */
  async findByOwnerProperties(
    propertyIds: (string | Types.ObjectId)[],
    options?: WaitingListFilterOptions
  ): Promise<IWaitingList[]> {
    const filter: FilterQuery<IWaitingList> = {
      propertyId: { $in: propertyIds.map(id => this.toObjectId(id)) },
    };

    if (options?.propertyId) filter.propertyId = this.toObjectId(options.propertyId);
    if (options?.unitId) filter.unitId = this.toObjectId(options.unitId);
    if (options?.status) filter.status = options.status;
    if (options?.type) filter.type = options.type;

    return this.model
      .find(filter)
      .populate(WAITING_LIST_POPULATE_OPTIONS)
      .sort({ position: 1, appliedAt: 1 })
      .exec();
  }

  /**
   * Find waiting list entries by applicant
   * @param applicantId - The applicant's user ID
   * @param status - Optional status filter
   * @returns Array of waiting list entries
   */
  async findByApplicant(
    applicantId: string | Types.ObjectId,
    status?: WaitingListStatus
  ): Promise<IWaitingList[]> {
    const filter: FilterQuery<IWaitingList> = {
      applicantId: this.toObjectId(applicantId),
    };

    if (status) filter.status = status;

    return this.model
      .find(filter)
      .populate([
        { path: 'propertyId', select: 'name address type images' },
        { path: 'unitId', select: 'unitNumber floor type pricing' },
      ])
      .sort({ appliedAt: -1 })
      .exec();
  }

  /**
   * Find active waiting list entry for applicant in property
   * @param applicantId - The applicant's user ID
   * @param propertyId - The property ID
   * @returns The waiting list entry or null
   */
  async findActiveByApplicantAndProperty(
    applicantId: string | Types.ObjectId,
    propertyId: string | Types.ObjectId
  ): Promise<IWaitingList | null> {
    return this.model.findOne({
      applicantId: this.toObjectId(applicantId),
      propertyId: this.toObjectId(propertyId),
      status: { $in: ['waiting', 'offered'] },
    }).exec();
  }

  /**
   * Find entry by ID and property (for authorization via property ownership)
   * @param entryId - The waiting list entry ID
   * @param propertyId - The property ID
   * @returns The waiting list entry or null
   */
  async findByIdAndProperty(
    entryId: string | Types.ObjectId,
    propertyId: string | Types.ObjectId
  ): Promise<IWaitingList | null> {
    return this.model.findOne({
      _id: this.toObjectId(entryId),
      propertyId: this.toObjectId(propertyId),
    }).exec();
  }

  /**
   * Find entry by ID and applicant (for applicant authorization)
   * @param entryId - The waiting list entry ID
   * @param applicantId - The applicant's user ID
   * @returns The waiting list entry or null
   */
  async findByIdAndApplicant(
    entryId: string | Types.ObjectId,
    applicantId: string | Types.ObjectId
  ): Promise<IWaitingList | null> {
    return this.model.findOne({
      _id: this.toObjectId(entryId),
      applicantId: this.toObjectId(applicantId),
    }).exec();
  }

  /**
   * Get next position in queue
   * @param propertyId - The property ID
   * @param unitId - Optional specific unit ID
   * @returns The next available position number
   */
  async getNextQueuePosition(
    propertyId: string | Types.ObjectId,
    unitId?: string | Types.ObjectId
  ): Promise<number> {
    const filter: FilterQuery<IWaitingList> = {
      propertyId: this.toObjectId(propertyId),
      type: 'queue',
      status: 'waiting',
    };

    if (unitId) {
      filter.unitId = this.toObjectId(unitId);
    }

    const lastEntry = await this.model
      .findOne(filter)
      .sort({ position: -1 })
      .exec();

    return lastEntry?.position ? lastEntry.position + 1 : 1;
  }

  /**
   * Update waiting list entry status
   * @param entryId - The waiting list entry ID
   * @param status - The new status
   * @returns The updated entry or null
   */
  async updateStatus(
    entryId: string | Types.ObjectId,
    status: WaitingListStatus
  ): Promise<IWaitingList | null> {
    return this.update(entryId, { status });
  }

  /**
   * Offer unit to applicant
   * @param entryId - The waiting list entry ID
   * @param unitId - The unit to offer
   * @param expiresInDays - Number of days until offer expires
   * @returns The updated entry or null
   */
  async offerUnit(
    entryId: string | Types.ObjectId,
    unitId: string | Types.ObjectId,
    expiresInDays: number = 3
  ): Promise<IWaitingList | null> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.update(entryId, {
      unitId: this.toObjectId(unitId),
      status: 'offered',
      offeredAt: new Date(),
      expiresAt,
    });
  }

  /**
   * Accept offer
   * @param entryId - The waiting list entry ID
   * @param applicantId - The applicant's user ID (for verification)
   * @returns The updated entry or null
   */
  async acceptOffer(
    entryId: string | Types.ObjectId,
    applicantId: string | Types.ObjectId
  ): Promise<IWaitingList | null> {
    return this.updateOne(
      {
        _id: this.toObjectId(entryId),
        applicantId: this.toObjectId(applicantId),
        status: 'offered',
      },
      { status: 'accepted' }
    );
  }

  /**
   * Reject offer
   * @param entryId - The waiting list entry ID
   * @param applicantId - The applicant's user ID (for verification)
   * @returns The updated entry or null
   */
  async rejectOffer(
    entryId: string | Types.ObjectId,
    applicantId: string | Types.ObjectId
  ): Promise<IWaitingList | null> {
    return this.updateOne(
      {
        _id: this.toObjectId(entryId),
        applicantId: this.toObjectId(applicantId),
        status: 'offered',
      },
      { status: 'rejected' }
    );
  }

  /**
   * Find and expire offers past their expiration date
   * @returns Number of expired offers
   */
  async expireOffers(): Promise<number> {
    const result = await this.model.updateMany(
      {
        status: 'offered',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' }
    );

    return result.modifiedCount;
  }

  /**
   * Update application details
   * @param entryId - The waiting list entry ID
   * @param application - Application data to update
   * @returns The updated entry or null
   */
  async updateApplication(
    entryId: string | Types.ObjectId,
    application: Partial<IApplication>
  ): Promise<IWaitingList | null> {
    const entry = await this.findById(entryId);
    if (!entry) return null;

    entry.application = {
      ...entry.application,
      ...application,
    } as IApplication;

    return entry.save();
  }

  /**
   * Reorder queue positions after removal
   * @param propertyId - The property ID
   * @param removedPosition - The position that was removed
   * @param unitId - Optional specific unit ID
   * @returns Number of updated entries
   */
  async reorderQueue(
    propertyId: string | Types.ObjectId,
    removedPosition: number,
    unitId?: string | Types.ObjectId
  ): Promise<number> {
    const filter: FilterQuery<IWaitingList> = {
      propertyId: this.toObjectId(propertyId),
      type: 'queue',
      status: 'waiting',
      position: { $gt: removedPosition },
    };

    if (unitId) {
      filter.unitId = this.toObjectId(unitId);
    }

    const result = await this.model.updateMany(
      filter,
      { $inc: { position: -1 } }
    );

    return result.modifiedCount;
  }

  /**
   * Check if applicant already on waiting list
   * @param applicantId - The applicant's user ID
   * @param propertyId - The property ID
   * @param unitId - Optional specific unit ID
   * @returns True if already on waiting list, false otherwise
   */
  async isApplicantOnWaitingList(
    applicantId: string | Types.ObjectId,
    propertyId: string | Types.ObjectId,
    unitId?: string | Types.ObjectId
  ): Promise<boolean> {
    const filter: FilterQuery<IWaitingList> = {
      applicantId: this.toObjectId(applicantId),
      propertyId: this.toObjectId(propertyId),
      status: { $in: ['waiting', 'offered'] },
    };

    if (unitId) {
      filter.unitId = this.toObjectId(unitId);
    }

    return this.exists(filter);
  }

  /**
   * Get waiting list statistics by property
   * @param propertyId - The property ID
   * @returns Statistics object
   */
  async getStatsByProperty(propertyId: string | Types.ObjectId): Promise<{
    total: number;
    byStatus: { status: WaitingListStatus; count: number }[];
    byType: { type: string; count: number }[];
    averageWaitTime: number;
  }> {
    const propertyObjectId = this.toObjectId(propertyId);

    const [total, byStatus, byType, waitTime] = await Promise.all([
      this.count({ propertyId: propertyObjectId }),
      this.aggregate<{ _id: WaitingListStatus; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: string; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ avgWait: number }>([
        {
          $match: {
            propertyId: propertyObjectId,
            status: 'accepted',
            offeredAt: { $exists: true },
          },
        },
        {
          $project: {
            waitTime: { $subtract: ['$offeredAt', '$appliedAt'] },
          },
        },
        {
          $group: {
            _id: null,
            avgWait: { $avg: '$waitTime' },
          },
        },
      ]),
    ]);

    // Convert wait time from milliseconds to days
    const avgWaitDays = waitTime[0]
      ? waitTime[0].avgWait / (1000 * 60 * 60 * 24)
      : 0;

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
      byType: byType.map((t) => ({ type: t._id, count: t.count })),
      averageWaitTime: Math.round(avgWaitDays * 100) / 100,
    };
  }

  /**
   * Get queue for specific property/unit
   * @param propertyId - The property ID
   * @param unitId - Optional specific unit ID
   * @returns Array of queue entries in order
   */
  async getQueue(
    propertyId: string | Types.ObjectId,
    unitId?: string | Types.ObjectId
  ): Promise<IWaitingList[]> {
    const filter: FilterQuery<IWaitingList> = {
      propertyId: this.toObjectId(propertyId),
      type: 'queue',
      status: 'waiting',
    };

    if (unitId) {
      filter.unitId = this.toObjectId(unitId);
    }

    return this.model
      .find(filter)
      .populate(WAITING_LIST_POPULATE_OPTIONS)
      .sort({ position: 1 })
      .exec();
  }
}
