import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { ILeaveRequest, LeaveStatus } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Leave Request Repository
 * Provides data access methods for LeaveRequest entities.
 * Extends BaseRepository with leave-request-specific query methods.
 */
@injectable()
export class LeaveRequestRepository extends BaseRepository<ILeaveRequest> {
  constructor(@inject(TYPES.LeaveRequestModel) model: Model<ILeaveRequest>) {
    super(model);
  }

  /**
   * Find leave requests by employee ID
   * @param employeeId - The employee ID
   * @param pagination - Optional pagination options
   * @returns Leave requests for the specified employee
   */
  async findByEmployee(
    employeeId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ILeaveRequest> | ILeaveRequest[]> {
    const filter: FilterQuery<ILeaveRequest> = { employeeId: this.toObjectId(employeeId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find leave requests by property ID
   * @param propertyId - The property ID
   * @param pagination - Optional pagination options
   * @returns Leave requests for the specified property
   */
  async findByPropertyId(
    propertyId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ILeaveRequest> | ILeaveRequest[]> {
    const filter: FilterQuery<ILeaveRequest> = { propertyId: this.toObjectId(propertyId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find all pending leave requests
   * @param propertyId - Optional property ID filter
   * @param pagination - Optional pagination options
   * @returns Pending leave requests
   */
  async findPending(
    propertyId?: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ILeaveRequest> | ILeaveRequest[]> {
    const filter: FilterQuery<ILeaveRequest> = { status: 'pending' as LeaveStatus };

    if (propertyId) {
      filter.propertyId = this.toObjectId(propertyId);
    }

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find leave requests by employee within a date range
   * @param employeeId - The employee ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Leave requests overlapping with the date range
   */
  async findByEmployeeAndDateRange(
    employeeId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<ILeaveRequest[]> {
    return this.model.find({
      employeeId: this.toObjectId(employeeId),
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    }).sort({ startDate: -1 }).exec();
  }
}
