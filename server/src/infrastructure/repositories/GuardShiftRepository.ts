import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IGuardShift } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Guard Shift Repository
 * Provides data access methods for GuardShift entities.
 * Extends BaseRepository with guard-shift-specific query methods.
 */
@injectable()
export class GuardShiftRepository extends BaseRepository<IGuardShift> {
  constructor(@inject(TYPES.GuardShiftModel) model: Model<IGuardShift>) {
    super(model);
  }

  /**
   * Find shifts by property ID
   * @param propertyId - The property ID
   * @param pagination - Optional pagination options
   * @returns Shifts assigned to the specified property
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IGuardShift> | IGuardShift[]> {
    const filter: FilterQuery<IGuardShift> = { propertyId: this.toObjectId(propertyId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { startTime: -1 },
      });
    }

    return this.model.find(filter).sort({ startTime: -1 }).exec();
  }

  /**
   * Find shifts by guard (employee) ID
   * @param guardId - The guard's employee ID
   * @param pagination - Optional pagination options
   * @returns Shifts assigned to the specified guard
   */
  async findByGuard(
    guardId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IGuardShift> | IGuardShift[]> {
    const filter: FilterQuery<IGuardShift> = { guardId: this.toObjectId(guardId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { startTime: -1 },
      });
    }

    return this.model.find(filter).sort({ startTime: -1 }).exec();
  }

  /**
   * Find active (currently ongoing) shifts for a property
   * @param propertyId - The property ID
   * @returns Array of active shifts
   */
  async findActiveByProperty(propertyId: string | Types.ObjectId): Promise<IGuardShift[]> {
    const now = new Date();
    return this.model.find({
      propertyId: this.toObjectId(propertyId),
      startTime: { $lte: now },
      endTime: { $gte: now },
    }).exec();
  }

  /**
   * Find shifts by property and guard
   * @param propertyId - The property ID
   * @param guardId - The guard's employee ID
   * @param pagination - Optional pagination options
   * @returns Shifts matching both property and guard
   */
  async findByPropertyAndGuard(
    propertyId: string | Types.ObjectId,
    guardId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IGuardShift> | IGuardShift[]> {
    const filter: FilterQuery<IGuardShift> = {
      propertyId: this.toObjectId(propertyId),
      guardId: this.toObjectId(guardId),
    };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { startTime: -1 },
      });
    }

    return this.model.find(filter).sort({ startTime: -1 }).exec();
  }

  /**
   * Find shifts that conflict with a given time range for a guard
   * @param guardId - The guard's employee ID
   * @param startTime - The proposed shift start time
   * @param endTime - The proposed shift end time
   * @param excludeShiftId - Optional shift ID to exclude (for updates)
   * @returns Array of conflicting shifts
   */
  async findConflictingShift(
    guardId: string | Types.ObjectId,
    startTime: Date,
    endTime: Date,
    excludeShiftId?: string | Types.ObjectId
  ): Promise<IGuardShift[]> {
    const filter: FilterQuery<IGuardShift> = {
      guardId: this.toObjectId(guardId),
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    };

    if (excludeShiftId) {
      filter._id = { $ne: this.toObjectId(excludeShiftId) };
    }

    return this.model.find(filter).exec();
  }
}
