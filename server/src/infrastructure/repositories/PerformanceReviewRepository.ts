import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPerformanceReview, ReviewStatus } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Performance Review Repository
 * Provides data access methods for PerformanceReview entities.
 * Extends BaseRepository with performance-review-specific query methods.
 */
@injectable()
export class PerformanceReviewRepository extends BaseRepository<IPerformanceReview> {
  constructor(@inject(TYPES.PerformanceReviewModel) model: Model<IPerformanceReview>) {
    super(model);
  }

  /**
   * Find performance reviews by employee ID
   * @param employeeId - The employee ID
   * @param pagination - Optional pagination options
   * @returns Performance reviews for the specified employee
   */
  async findByEmployee(
    employeeId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IPerformanceReview> | IPerformanceReview[]> {
    const filter: FilterQuery<IPerformanceReview> = { employeeId: this.toObjectId(employeeId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { reviewDate: -1 },
      });
    }

    return this.model.find(filter).sort({ reviewDate: -1 }).exec();
  }

  /**
   * Find performance reviews by property ID
   * @param propertyId - The property ID
   * @param pagination - Optional pagination options
   * @returns Performance reviews for the specified property
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IPerformanceReview> | IPerformanceReview[]> {
    const filter: FilterQuery<IPerformanceReview> = { propertyId: this.toObjectId(propertyId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { reviewDate: -1 },
      });
    }

    return this.model.find(filter).sort({ reviewDate: -1 }).exec();
  }

  /**
   * Find performance reviews by reviewer ID
   * @param reviewerId - The reviewer's user or employee ID
   * @param pagination - Optional pagination options
   * @returns Performance reviews conducted by the specified reviewer
   */
  async findByReviewer(
    reviewerId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IPerformanceReview> | IPerformanceReview[]> {
    const filter: FilterQuery<IPerformanceReview> = { reviewerId: this.toObjectId(reviewerId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { reviewDate: -1 },
      });
    }

    return this.model.find(filter).sort({ reviewDate: -1 }).exec();
  }
}
