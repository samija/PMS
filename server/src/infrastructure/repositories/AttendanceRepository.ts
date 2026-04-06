import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IAttendance, AttendanceStatus } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Attendance Repository
 * Provides data access methods for Attendance entities.
 * Extends BaseRepository with attendance-specific query methods.
 */
@injectable()
export class AttendanceRepository extends BaseRepository<IAttendance> {
  constructor(@inject(TYPES.AttendanceModel) model: Model<IAttendance>) {
    super(model);
  }

  /**
   * Find attendance records by employee ID
   * @param employeeId - The employee ID
   * @param pagination - Optional pagination options
   * @returns Attendance records for the specified employee
   */
  async findByEmployee(
    employeeId: string | Types.ObjectId,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IAttendance> | IAttendance[]> {
    const filter: FilterQuery<IAttendance> = { employeeId: this.toObjectId(employeeId) };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { date: -1 },
      });
    }

    return this.model.find(filter).sort({ date: -1 }).exec();
  }

  /**
   * Find attendance records by property and date
   * @param propertyId - The property ID
   * @param date - The date to filter by
   * @returns Attendance records for the specified property and date
   */
  async findByPropertyAndDate(
    propertyId: string | Types.ObjectId,
    date: Date
  ): Promise<IAttendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.model.find({
      propertyId: this.toObjectId(propertyId),
      date: { $gte: startOfDay, $lte: endOfDay },
    }).exec();
  }

  /**
   * Find attendance records by employee and date range
   * @param employeeId - The employee ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Attendance records within the date range
   */
  async findByEmployeeAndDate(
    employeeId: string | Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<IAttendance[]> {
    return this.model.find({
      employeeId: this.toObjectId(employeeId),
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 }).exec();
  }

  /**
   * Get monthly attendance report for a property
   * @param propertyId - The property ID
   * @param year - The year
   * @param month - The month (1-12)
   * @returns Aggregated attendance statistics
   */
  async getMonthlyReport(
    propertyId: string | Types.ObjectId,
    year: number,
    month: number
  ): Promise<{ _id: AttendanceStatus; count: number }[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return this.aggregate<{ _id: AttendanceStatus; count: number }>([
      {
        $match: {
          propertyId: this.toObjectId(propertyId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}
