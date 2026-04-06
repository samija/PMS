import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPayroll, PayrollStatus } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Payroll Repository
 * Provides data access methods for Payroll entities.
 * Extends BaseRepository with payroll-specific query methods.
 */
@injectable()
export class PayrollRepository extends BaseRepository<IPayroll> {
  constructor(@inject(TYPES.PayrollModel) model: Model<IPayroll>) {
    super(model);
  }

  /**
   * Find payroll records by employee ID
   * @param employeeId - The employee ID
   * @param pagination - Optional pagination options
   * @returns Payroll records for the specified employee
   */
  async findByEmployee(
    employeeId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IPayroll> | IPayroll[]> {
    const filter: FilterQuery<IPayroll> = { employeeId: this.toObjectId(employeeId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { periodEnd: -1 },
      });
    }

    return this.model.find(filter).sort({ periodEnd: -1 }).exec();
  }

  /**
   * Find payroll records by property and pay period
   * @param propertyId - The property ID
   * @param periodStart - Start of the pay period
   * @param periodEnd - End of the pay period
   * @returns Payroll records matching property and period
   */
  async findByPropertyAndPeriod(
    propertyId: string | Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<IPayroll[]> {
    return this.model.find({
      propertyId: this.toObjectId(propertyId),
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    }).sort({ periodEnd: -1 }).exec();
  }

  /**
   * Find payroll records by status
   * @param status - The payroll status to filter by
   * @param pagination - Optional pagination options
   * @returns Payroll records with the specified status
   */
  async findByStatus(
    status: PayrollStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IPayroll> | IPayroll[]> {
    const filter: FilterQuery<IPayroll> = { status };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { periodEnd: -1 },
      });
    }

    return this.model.find(filter).sort({ periodEnd: -1 }).exec();
  }

  /**
   * Find payroll records by employee and pay period
   * @param employeeId - The employee ID
   * @param periodStart - Start of the pay period
   * @param periodEnd - End of the pay period
   * @returns Payroll records matching employee and period
   */
  async findByEmployeeAndPeriod(
    employeeId: string | Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<IPayroll[]> {
    return this.model.find({
      employeeId: this.toObjectId(employeeId),
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    }).sort({ periodEnd: -1 }).exec();
  }
}
