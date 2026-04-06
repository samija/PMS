import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IEmployee, EmploymentDepartment, EmploymentStatus } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import TYPES from '../../config/types.js';

/**
 * Employee Repository
 * Provides data access methods for Employee entities.
 * Extends BaseRepository with employee-specific query methods.
 */
@injectable()
export class EmployeeRepository extends BaseRepository<IEmployee> {
  constructor(@inject(TYPES.EmployeeModel) model: Model<IEmployee>) {
    super(model);
  }

  /**
   * Find an employee by their associated user ID
   * @param userId - The user ID linked to the employee
   * @returns The employee or null if not found
   */
  async findByUserId(userId: string | Types.ObjectId): Promise<IEmployee | null> {
    return this.model.findOne({ userId: this.toObjectId(userId) }).exec();
  }

  /**
   * Find employees by department
   * @param department - The department to filter by
   * @param pagination - Optional pagination options
   * @returns Paginated employees or array of employees
   */
  async findByDepartment(
    department: EmploymentDepartment,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IEmployee> | IEmployee[]> {
    const filter: FilterQuery<IEmployee> = { department };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).exec();
  }

  /**
   * Find employees by employment status
   * @param status - The employment status to filter by
   * @param pagination - Optional pagination options
   * @returns Paginated employees or array of employees
   */
  async findByStatus(
    status: EmploymentStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IEmployee> | IEmployee[]> {
    const filter: FilterQuery<IEmployee> = { status };

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).exec();
  }

  /**
   * Find an employee by their unique employee ID
   * @param employeeId - The employee identifier string
   * @returns The employee or null if not found
   */
  async findByEmployeeId(employeeId: string): Promise<IEmployee | null> {
    return this.model.findOne({ employeeId }).exec();
  }

  /**
   * Search employees by name, email, or employee ID
   * @param searchTerm - The search term
   * @param filters - Optional filters for department and status
   * @param pagination - Optional pagination options
   * @returns Matching employees
   */
  async search(
    searchTerm: string,
    filters?: { department?: EmploymentDepartment; status?: EmploymentStatus },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<IEmployee> | IEmployee[]> {
    const searchRegex = new RegExp(searchTerm, 'i');
    const filter: FilterQuery<IEmployee> = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
      ],
    };

    if (filters?.department) {
      filter.department = filters.department;
    }

    if (filters?.status) {
      filter.status = filters.status;
    }

    if (pagination) {
      return this.findWithPagination(filter, pagination, {
        sort: { createdAt: -1 },
      });
    }

    return this.model.find(filter).exec();
  }
}
