import { Request, Response } from 'express';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import WaitingList from '../models/WaitingList.js';

export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 12,
      type,
      city,
      minPrice,
      maxPrice,
      bedrooms,
      search,
    } = req.query;

    const query: any = { isListed: true };

    if (type) query.type = type;
    if (city) query['address.city'] = new RegExp(city as string, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') },
        { 'address.city': new RegExp(search as string, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [properties, total] = await Promise.all([
      Property.find(query)
        .select('-ownerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(query),
    ]);

    // Get available units count for each property
    const propertiesWithUnits = await Promise.all(
      properties.map(async (property) => {
        const availableUnits = await Unit.countDocuments({
          propertyId: property._id,
          status: 'vacant',
        });

        const priceRange = await Unit.aggregate([
          { $match: { propertyId: property._id, status: 'vacant' } },
          {
            $group: {
              _id: null,
              minPrice: { $min: '$pricing.totalPrice' },
              maxPrice: { $max: '$pricing.totalPrice' },
            },
          },
        ]);

        return {
          ...property.toObject(),
          availableUnits,
          priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
        };
      })
    );

    // Apply price filter if specified
    let filteredProperties = propertiesWithUnits;
    if (minPrice || maxPrice) {
      filteredProperties = propertiesWithUnits.filter((p) => {
        if (minPrice && p.priceRange.maxPrice < Number(minPrice)) return false;
        if (maxPrice && p.priceRange.minPrice > Number(maxPrice)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      data: {
        listings: filteredProperties,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listings',
    });
  }
};

export const getListingDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({ _id: id, isListed: true })
      .select('-ownerId')
      .populate('ownerId', 'name phone');

    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
      return;
    }

    // Get available units
    const units = await Unit.find({
      propertyId: id,
      status: 'vacant',
    }).select('-currentTenantId');

    // Get waiting list count
    const waitingListCount = await WaitingList.countDocuments({
      propertyId: id,
      status: 'waiting',
    });

    res.json({
      success: true,
      data: {
        ...property.toObject(),
        availableUnits: units,
        waitingListCount,
      },
    });
  } catch (error) {
    console.error('Get listing detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get listing detail',
    });
  }
};

export const getListingUnits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, floor, status = 'vacant' } = req.query;

    // Verify property is listed
    const property = await Property.findOne({ _id: id, isListed: true });
    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
      return;
    }

    const query: any = { propertyId: id };
    if (status) query.status = status;
    if (type) query.type = type;
    if (floor) query.floor = Number(floor);

    const units = await Unit.find(query)
      .select('-currentTenantId')
      .sort({ floor: 1, unitNumber: 1 });

    res.json({
      success: true,
      data: units,
    });
  } catch (error) {
    console.error('Get listing units error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get units',
    });
  }
};

export const getFeaturedListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 6 } = req.query;

    // Get properties with most available units
    const properties = await Property.aggregate([
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
      {
        $project: {
          units: 0,
          ownerId: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error('Get featured listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured listings',
    });
  }
};

export default {
  getListings,
  getListingDetail,
  getListingUnits,
  getFeaturedListings,
};
