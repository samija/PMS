import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IProperty, IUnit, IWaitingList } from '../../types/index.js';
import { NotFoundError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

export interface ListingFilters {
  page?: number;
  limit?: number;
  type?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  search?: string;
}

export interface ListingResult {
  listings: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@injectable()
export class ListingService {
  private propertyModel: Model<IProperty>;
  private unitModel: Model<IUnit>;
  private waitingListModel: Model<IWaitingList>;

  constructor(
    @inject(TYPES.PropertyModel) propertyModel: Model<IProperty>,
    @inject(TYPES.UnitModel) unitModel: Model<IUnit>,
    @inject(TYPES.WaitingListModel) waitingListModel: Model<IWaitingList>
  ) {
    this.propertyModel = propertyModel;
    this.unitModel = unitModel;
    this.waitingListModel = waitingListModel;
  }

  async getListings(filters: ListingFilters): Promise<ListingResult> {
    const { page = 1, limit = 12, type, city, minPrice, maxPrice, search } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    // Build the base match stage
    const matchStage: any = { isListed: true };
    if (type) matchStage.type = type;
    if (city) matchStage['address.city'] = new RegExp(city as string, 'i');
    if (search) {
      matchStage.$or = [
        { name: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
        { 'address.city': new RegExp(search as string, 'i') },
      ];
    }

    // Single aggregation pipeline: fetch properties with unit stats in one query
    const aggregationPipeline: any[] = [
      { $match: matchStage },
      // Join vacant units per property
      {
        $lookup: {
          from: 'units',
          let: { propId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$propertyId', '$$propId'] }, { $eq: ['$status', 'vacant'] }] } } },
            { $project: { 'pricing.totalPrice': 1 } },
          ],
          as: '_vacantUnits',
        },
      },
      // Compute available unit count and price range from the joined array
      {
        $addFields: {
          availableUnits: { $size: '$_vacantUnits' },
          priceRange: {
            $cond: {
              if: { $gt: [{ $size: '$_vacantUnits' }, 0] },
              then: {
                minPrice: { $min: '$_vacantUnits.pricing.totalPrice' },
                maxPrice: { $max: '$_vacantUnits.pricing.totalPrice' },
              },
              else: { minPrice: 0, maxPrice: 0 },
            },
          },
        },
      },
      // Remove the raw joined array and ownerId from public response
      { $project: { _vacantUnits: 0, ownerId: 0 } },
    ];

    // Apply price filter after enrichment
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceMatch: any = {};
      if (minPrice !== undefined) priceMatch['priceRange.maxPrice'] = { $gte: Number(minPrice) };
      if (maxPrice !== undefined) priceMatch['priceRange.minPrice'] = { $lte: Number(maxPrice) };
      aggregationPipeline.push({ $match: priceMatch });
    }

    // Count total after all filters (before skip/limit)
    const countPipeline = [...aggregationPipeline, { $count: 'total' }];

    // Paginate
    aggregationPipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: Number(limit) });

    const [listings, countResult] = await Promise.all([
      this.propertyModel.aggregate(aggregationPipeline),
      this.propertyModel.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      listings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getListingDetail(id: string): Promise<any> {
    const property = await this.propertyModel
      .findOne({ _id: id, isListed: true })
      .select('-ownerId')
      .populate('ownerId', 'name phone')
      .lean();

    if (!property) {
      throw new NotFoundError('Listing', id);
    }

    const [units, waitingListCount] = await Promise.all([
      this.unitModel
        .find({ propertyId: new Types.ObjectId(id), status: 'vacant' })
        .select('-currentTenantId')
        .lean(),
      this.waitingListModel.countDocuments({ propertyId: new Types.ObjectId(id), status: 'waiting' }),
    ]);

    return {
      ...property,
      availableUnits: units,
      waitingListCount,
    };
  }

  async getListingUnits(
    id: string,
    filters: { type?: string; floor?: number; status?: string }
  ): Promise<IUnit[]> {
    const property = await this.propertyModel.findOne({ _id: id, isListed: true }).lean();
    if (!property) {
      throw new NotFoundError('Listing', id);
    }

    const query: any = { propertyId: new Types.ObjectId(id) };
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.floor !== undefined) query.floor = Number(filters.floor);

    const units = await this.unitModel
      .find(query)
      .select('-currentTenantId')
      .sort({ floor: 1, unitNumber: 1 })
      .lean();

    return units as unknown as IUnit[];
  }

  async getFeaturedListings(limit: number = 6): Promise<any[]> {
    return this.propertyModel.aggregate([
      { $match: { isListed: true } },
      {
        $lookup: {
          from: 'units',
          localField: '_id',
          foreignField: 'propertyId',
          as: 'units',
        },
      },
      {
        $addFields: {
          availableUnits: {
            $size: {
              $filter: {
                input: '$units',
                as: 'unit',
                cond: { $eq: ['$$unit.status', 'vacant'] },
              },
            },
          },
        },
      },
      { $match: { availableUnits: { $gt: 0 } } },
      { $sort: { availableUnits: -1, createdAt: -1 } },
      { $limit: Number(limit) },
      { $project: { units: 0, ownerId: 0 } },
    ]);
  }
}
