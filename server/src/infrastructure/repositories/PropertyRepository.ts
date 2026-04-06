import { Model, Types, FilterQuery } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IProperty, PropertyType, ListingStatus, WaitingListType } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { PaginationOptions, PaginatedResult } from '../../domain/interfaces/IRepository.js';
import { IPropertyRepository, PropertyFilterOptions } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * Property filter options
 */
export { PropertyFilterOptions };

/**
 * Property Repository
 * Provides data access methods for Property entities.
 * Extends BaseRepository with property-specific query methods.
 */
@injectable()
export class PropertyRepository extends BaseRepository<IProperty> implements IPropertyRepository {
  constructor(@inject(TYPES.PropertyModel) model: Model<IProperty>) {
    super(model);
  }

  /**
   * Find properties by owner ID
   * @param ownerId - The owner's user ID
   * @returns Array of properties owned by the user
   */
  async findByOwner(ownerId: string | Types.ObjectId): Promise<IProperty[]> {
    return this.model.find({ ownerId: this.toObjectId(ownerId) }).exec();
  }

  /**
   * Find properties by owner with pagination
   * @param ownerId - The owner's user ID
   * @param pagination - Pagination options
   * @returns Paginated properties
   */
  async findByOwnerWithPagination(
    ownerId: string | Types.ObjectId,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IProperty>> {
    return this.findWithPagination(
      { ownerId: this.toObjectId(ownerId) },
      pagination,
      {
        sort: { createdAt: -1 },
        populate: { path: 'ownerId', select: 'name email' },
      }
    );
  }

  /**
   * Find property by ID and owner (for authorization)
   * @param propertyId - The property ID
   * @param ownerId - The owner's user ID
   * @returns The property or null if not found or not owned
   */
  async findByIdAndOwner(
    propertyId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId
  ): Promise<IProperty | null> {
    return this.model.findOne({
      _id: this.toObjectId(propertyId),
      ownerId: this.toObjectId(ownerId),
    }).exec();
  }

  /**
   * Find listed properties
   * @param options - Optional filter options
   * @returns Array of listed properties
   */
  async findListed(options?: Omit<PropertyFilterOptions, 'isListed'>): Promise<IProperty[]> {
    const filter: FilterQuery<IProperty> = { isListed: true };

    if (options?.type) filter.type = options.type;
    if (options?.listingStatus) filter.listingStatus = options.listingStatus;
    if (options?.city) filter['address.city'] = options.city;
    if (options?.state) filter['address.state'] = options.state;

    return this.model.find(filter).exec();
  }

  /**
   * Find listed properties with pagination (for public listing)
   * @param pagination - Pagination options
   * @param options - Optional filter options
   * @returns Paginated listed properties
   */
  async findListedWithPagination(
    pagination: PaginationOptions,
    options?: Omit<PropertyFilterOptions, 'isListed'>
  ): Promise<PaginatedResult<IProperty>> {
    const filter: FilterQuery<IProperty> = { isListed: true };

    if (options?.type) filter.type = options.type;
    if (options?.listingStatus) filter.listingStatus = options.listingStatus;
    if (options?.city) filter['address.city'] = options.city;
    if (options?.state) filter['address.state'] = options.state;

    return this.findWithPagination(filter, pagination, {
      sort: { createdAt: -1 },
    });
  }

  /**
   * Find properties by type
   * @param type - The property type
   * @returns Array of properties of the specified type
   */
  async findByType(type: PropertyType): Promise<IProperty[]> {
    return this.model.find({ type }).exec();
  }

  /**
   * Find properties by listing status
   * @param status - The listing status
   * @returns Array of properties with the specified status
   */
  async findByListingStatus(status: ListingStatus): Promise<IProperty[]> {
    return this.model.find({ listingStatus: status }).exec();
  }

  /**
   * Find properties by city
   * @param city - The city name
   * @param isListed - Optional filter for listed properties only
   * @returns Array of properties in the specified city
   */
  async findByCity(city: string, isListed?: boolean): Promise<IProperty[]> {
    const filter: FilterQuery<IProperty> = { 'address.city': city };
    if (isListed !== undefined) filter.isListed = isListed;
    return this.model.find(filter).exec();
  }

  /**
   * Find properties within a geographic area
   * @param lat - Center latitude
   * @param lng - Center longitude
   * @param radiusKm - Radius in kilometers
   * @returns Array of properties within the area
   */
  async findNearby(lat: number, lng: number, radiusKm: number): Promise<IProperty[]> {
    // Note: This requires a 2dsphere index on address.coordinates
    // For simplicity, using a basic box query
    const latDiff = radiusKm / 111; // Approximate degrees per km
    const lngDiff = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return this.model.find({
      isListed: true,
      'address.coordinates.lat': { $gte: lat - latDiff, $lte: lat + latDiff },
      'address.coordinates.lng': { $gte: lng - lngDiff, $lte: lng + lngDiff },
    }).exec();
  }

  /**
   * Toggle property listing status
   * @param propertyId - The property ID
   * @param ownerId - The owner's user ID (for authorization)
   * @returns The updated property or null
   */
  async toggleListing(
    propertyId: string | Types.ObjectId,
    ownerId: string | Types.ObjectId
  ): Promise<IProperty | null> {
    const property = await this.findByIdAndOwner(propertyId, ownerId);
    if (!property) return null;

    property.isListed = !property.isListed;
    return property.save();
  }

  /**
   * Update listing status
   * @param propertyId - The property ID
   * @param status - The new listing status
   * @returns The updated property or null
   */
  async updateListingStatus(
    propertyId: string | Types.ObjectId,
    status: ListingStatus
  ): Promise<IProperty | null> {
    return this.update(propertyId, { listingStatus: status });
  }

  /**
   * Update waiting list type
   * @param propertyId - The property ID
   * @param type - The waiting list type
   * @returns The updated property or null
   */
  async updateWaitingListType(
    propertyId: string | Types.ObjectId,
    type: WaitingListType
  ): Promise<IProperty | null> {
    return this.update(propertyId, { waitingListType: type });
  }

  /**
   * Add images to property
   * @param propertyId - The property ID
   * @param imageUrls - Array of image URLs to add
   * @returns The updated property or null
   */
  async addImages(
    propertyId: string | Types.ObjectId,
    imageUrls: string[]
  ): Promise<IProperty | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(propertyId),
      { $push: { images: { $each: imageUrls } } },
      { new: true }
    ).exec();
  }

  /**
   * Remove image from property
   * @param propertyId - The property ID
   * @param imageUrl - The image URL to remove
   * @returns The updated property or null
   */
  async removeImage(
    propertyId: string | Types.ObjectId,
    imageUrl: string
  ): Promise<IProperty | null> {
    return this.model.findByIdAndUpdate(
      this.toObjectId(propertyId),
      { $pull: { images: imageUrl } },
      { new: true }
    ).exec();
  }

  /**
   * Update amenities
   * @param propertyId - The property ID
   * @param amenities - The new amenities array
   * @returns The updated property or null
   */
  async updateAmenities(
    propertyId: string | Types.ObjectId,
    amenities: string[]
  ): Promise<IProperty | null> {
    return this.update(propertyId, { amenities });
  }

  /**
   * Search properties by name or address
   * @param searchTerm - The search term
   * @param isListed - Optional filter for listed properties
   * @returns Array of matching properties
   */
  async search(searchTerm: string, isListed?: boolean): Promise<IProperty[]> {
    const searchRegex = new RegExp(searchTerm, 'i');
    const filter: FilterQuery<IProperty> = {
      $or: [
        { name: searchRegex },
        { 'address.street': searchRegex },
        { 'address.city': searchRegex },
        { description: searchRegex },
      ],
    };

    if (isListed !== undefined) {
      filter.isListed = isListed;
    }

    return this.model.find(filter).exec();
  }

  /**
   * Get property statistics by owner
   * @param ownerId - The owner's user ID
   * @returns Statistics object
   */
  async getStatsByOwner(ownerId: string | Types.ObjectId): Promise<{
    total: number;
    listed: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const ownerObjectId = this.toObjectId(ownerId);

    const [total, listed, byType, byStatus] = await Promise.all([
      this.count({ ownerId: ownerObjectId }),
      this.count({ ownerId: ownerObjectId, isListed: true }),
      this.aggregate<{ _id: string; count: number }>([
        { $match: { ownerId: ownerObjectId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.aggregate<{ _id: string; count: number }>([
        { $match: { ownerId: ownerObjectId } },
        { $group: { _id: '$listingStatus', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      listed,
      byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    };
  }

  /**
   * Find properties with available units
   * @param ownerId - Optional owner filter
   * @returns Array of property IDs with vacant units
   */
  async findWithAvailableUnits(ownerId?: string | Types.ObjectId): Promise<Types.ObjectId[]> {
    // This would typically involve a join with Units collection
    // For now, returning properties with 'available' listing status
    const filter: FilterQuery<IProperty> = { listingStatus: 'available' };
    if (ownerId) filter.ownerId = this.toObjectId(ownerId);

    const properties = await this.model.find(filter).select('_id').exec();
    return properties.map(p => p._id);
  }
}
