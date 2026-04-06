import { Document, Model, FilterQuery, UpdateQuery, Types } from 'mongoose';
import { injectable, unmanaged } from 'inversify';
import {
  IRepository,
  PaginationOptions,
  PaginatedResult,
  QueryOptions,
  PopulateOptions,
} from '../../domain/interfaces/IRepository.js';

/**
 * Base Repository
 * Abstract class providing common repository functionality for all entities.
 * Implements the IRepository interface with Mongoose as the underlying data store.
 *
 * @typeParam T - The document type extending Mongoose Document
 */
@injectable()
export abstract class BaseRepository<T extends Document> implements IRepository<T> {
  protected readonly model: Model<T>;

  /**
   * Create a new BaseRepository instance
   * @param model - The Mongoose model to use for database operations
   */
  constructor(@unmanaged() model: Model<T>) {
    this.model = model;
  }

  /**
   * Apply query options (select, populate, sort, lean) to a Mongoose query
   * @param query - The Mongoose query to apply options to
   * @param options - The query options to apply
   * @returns The modified query
   */
  protected applyQueryOptions(
    query: any,
    options?: QueryOptions<T>
  ): any {
    if (!options) {
      return query;
    }

    if (options.select) {
      query = query.select(options.select as string);
    }

    if (options.populate) {
      const populateOptions = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];

      populateOptions.forEach((pop) => {
        if (typeof pop === 'string') {
          query = query.populate(pop);
        } else {
          query = query.populate(pop as PopulateOptions);
        }
      });
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.lean) {
      query = query.lean();
    }

    return query;
  }

  /**
   * Convert string ID to ObjectId if necessary
   * @param id - The ID to convert
   * @returns MongoDB ObjectId
   */
  protected toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    if (typeof id === 'string') {
      return new Types.ObjectId(id);
    }
    return id;
  }

  /**
   * Find a document by its ID
   */
  async findById(
    id: string | Types.ObjectId,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    const query = this.model.findById(this.toObjectId(id));
    return this.applyQueryOptions(query, options).exec();
  }

  /**
   * Find a single document matching the filter
   */
  async findOne(
    filter: FilterQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    const query = this.model.findOne(filter);
    return this.applyQueryOptions(query, options).exec();
  }

  /**
   * Find all documents matching the filter
   */
  async findAll(
    filter: FilterQuery<T> = {},
    options?: QueryOptions<T>
  ): Promise<T[]> {
    const query = this.model.find(filter);
    return this.applyQueryOptions(query, options).exec();
  }

  /**
   * Find documents with pagination
   */
  async findWithPagination(
    filter: FilterQuery<T>,
    pagination: PaginationOptions,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort } = pagination;
    const skip = (page - 1) * limit;

    // Build the query
    let query = this.model.find(filter);

    // Apply sorting (use pagination sort if provided, otherwise use options sort)
    if (sort) {
      query = query.sort(sort);
    } else if (options?.sort) {
      query = query.sort(options.sort);
    }

    // Apply other options
    if (options?.select) {
      query = query.select(options.select as string);
    }

    if (options?.populate) {
      const populateOptions = Array.isArray(options.populate)
        ? options.populate
        : [options.populate];

      populateOptions.forEach((pop) => {
        if (typeof pop === 'string') {
          query = query.populate(pop);
        } else {
          query = query.populate(pop as PopulateOptions);
        }
      });
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).lean().exec() as Promise<T[]>,
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[]): Promise<T[]> {
    const result = await this.model.insertMany(data);
    return result as unknown as T[];
  }

  /**
   * Update a document by ID
   */
  async update(
    id: string | Types.ObjectId,
    data: UpdateQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    const query = this.model.findByIdAndUpdate(
      this.toObjectId(id),
      data,
      { new: true, runValidators: true }
    );
    return this.applyQueryOptions(query, options).exec();
  }

  /**
   * Update a single document matching the filter
   */
  async updateOne(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T | null> {
    const query = this.model.findOneAndUpdate(
      filter,
      data,
      { new: true, runValidators: true }
    );
    return this.applyQueryOptions(query, options).exec();
  }

  /**
   * Update multiple documents matching the filter
   */
  async updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<number> {
    const result = await this.model.updateMany(filter, data, { runValidators: true });
    return result.modifiedCount;
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string | Types.ObjectId): Promise<T | null> {
    return this.model.findByIdAndDelete(this.toObjectId(id)).exec();
  }

  /**
   * Delete a single document matching the filter
   */
  async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOneAndDelete(filter).exec();
  }

  /**
   * Delete multiple documents matching the filter
   */
  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount;
  }

  /**
   * Count documents matching the filter
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  /**
   * Check if a document exists matching the filter
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter);
    return result !== null;
  }

  /**
   * Perform an aggregation pipeline
   */
  async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
