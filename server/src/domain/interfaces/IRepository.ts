import { Document, FilterQuery, UpdateQuery, Types } from 'mongoose';

/**
 * Pagination options for repository queries
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Query options for find operations
 */
export interface QueryOptions<T> {
  select?: string | string[] | Record<string, 0 | 1>;
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
  sort?: Record<string, 1 | -1>;
  lean?: boolean;
}

/**
 * Populate options for relationship loading
 */
export interface PopulateOptions {
  path: string;
  select?: string;
  populate?: PopulateOptions | PopulateOptions[];
}

/**
 * Generic Repository Interface
 * Defines the contract for all repository implementations
 *
 * @typeParam T - The document type extending Mongoose Document
 */
export interface IRepository<T extends Document> {
  /**
   * Find a document by its ID
   * @param id - The document ID (string or ObjectId)
   * @param options - Optional query options (select, populate)
   * @returns The document or null if not found
   */
  findById(
    id: string | Types.ObjectId,
    options?: QueryOptions<T>
  ): Promise<T | null>;

  /**
   * Find a single document matching the filter
   * @param filter - MongoDB filter query
   * @param options - Optional query options
   * @returns The first matching document or null
   */
  findOne(
    filter: FilterQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T | null>;

  /**
   * Find all documents matching the filter
   * @param filter - MongoDB filter query
   * @param options - Optional query options
   * @returns Array of matching documents
   */
  findAll(
    filter?: FilterQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T[]>;

  /**
   * Find documents with pagination
   * @param filter - MongoDB filter query
   * @param pagination - Pagination options (page, limit, sort)
   * @param options - Optional query options
   * @returns Paginated result with data and pagination info
   */
  findWithPagination(
    filter: FilterQuery<T>,
    pagination: PaginationOptions,
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>>;

  /**
   * Create a new document
   * @param data - The data to create the document with
   * @returns The created document
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Create multiple documents
   * @param data - Array of data to create documents with
   * @returns Array of created documents
   */
  createMany(data: Partial<T>[]): Promise<T[]>;

  /**
   * Update a document by ID
   * @param id - The document ID
   * @param data - The update data
   * @param options - Optional query options
   * @returns The updated document or null if not found
   */
  update(
    id: string | Types.ObjectId,
    data: UpdateQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T | null>;

  /**
   * Update a single document matching the filter
   * @param filter - MongoDB filter query
   * @param data - The update data
   * @param options - Optional query options
   * @returns The updated document or null if not found
   */
  updateOne(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
    options?: QueryOptions<T>
  ): Promise<T | null>;

  /**
   * Update multiple documents matching the filter
   * @param filter - MongoDB filter query
   * @param data - The update data
   * @returns Number of documents modified
   */
  updateMany(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>
  ): Promise<number>;

  /**
   * Delete a document by ID
   * @param id - The document ID
   * @returns The deleted document or null if not found
   */
  delete(id: string | Types.ObjectId): Promise<T | null>;

  /**
   * Delete a single document matching the filter
   * @param filter - MongoDB filter query
   * @returns The deleted document or null if not found
   */
  deleteOne(filter: FilterQuery<T>): Promise<T | null>;

  /**
   * Delete multiple documents matching the filter
   * @param filter - MongoDB filter query
   * @returns Number of documents deleted
   */
  deleteMany(filter: FilterQuery<T>): Promise<number>;

  /**
   * Count documents matching the filter
   * @param filter - MongoDB filter query
   * @returns The count of matching documents
   */
  count(filter?: FilterQuery<T>): Promise<number>;

  /**
   * Check if a document exists matching the filter
   * @param filter - MongoDB filter query
   * @returns True if a document exists, false otherwise
   */
  exists(filter: FilterQuery<T>): Promise<boolean>;

  /**
   * Perform an aggregation pipeline
   * @param pipeline - MongoDB aggregation pipeline
   * @returns Aggregation results
   */
  aggregate<R = any>(pipeline: any[]): Promise<R[]>;
}
