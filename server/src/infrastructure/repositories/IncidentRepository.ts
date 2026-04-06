import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IIncident, IncidentStatus, IncidentSeverity } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Incident Repository
 * Provides data access methods for Incident entities.
 * Extends BaseRepository with incident-specific query methods.
 */
@injectable()
export class IncidentRepository extends BaseRepository<IIncident> {
  constructor(@inject(TYPES.IncidentModel) model: Model<IIncident>) {
    super(model);
  }

  /**
   * Find incidents by property ID
   * @param propertyId - The property ID
   * @param pagination - Optional pagination options
   * @returns Incidents for the specified property
   */
  async findByProperty(
    propertyId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IIncident> | IIncident[]> {
    const filter: FilterQuery<IIncident> = { propertyId: this.toObjectId(propertyId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find incidents by reporter (employee) ID
   * @param reporterId - The reporter's employee ID
   * @param pagination - Optional pagination options
   * @returns Incidents reported by the specified employee
   */
  async findByReporter(
    reporterId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IIncident> | IIncident[]> {
    const filter: FilterQuery<IIncident> = { reportedBy: this.toObjectId(reporterId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find incidents by property and status
   * @param propertyId - The property ID
   * @param status - The incident status to filter by
   * @param pagination - Optional pagination options
   * @returns Incidents matching property and status
   */
  async findByPropertyAndStatus(
    propertyId: string | Types.ObjectId,
    status: IncidentStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IIncident> | IIncident[]> {
    const filter: FilterQuery<IIncident> = {
      propertyId: this.toObjectId(propertyId),
      status,
    };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Get incident statistics for a property
   * @param propertyId - The property ID
   * @returns Aggregated incident stats by status and severity
   */
  async getStatsByProperty(
    propertyId: string | Types.ObjectId
  ): Promise<{
    byStatus: { _id: IncidentStatus; count: number }[];
    bySeverity: { _id: IncidentSeverity; count: number }[];
    total: number;
  }> {
    const propertyObjectId = this.toObjectId(propertyId);

    const [byStatus, bySeverity, total] = await Promise.all([
      this.aggregate<{ _id: IncidentStatus; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: IncidentSeverity; count: number }>([
        { $match: { propertyId: propertyObjectId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.count({ propertyId: propertyObjectId }),
    ]);

    return { byStatus, bySeverity, total };
  }
}
