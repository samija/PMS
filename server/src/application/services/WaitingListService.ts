import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IWaitingList, IProperty, IUnit } from '../../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../domain/exceptions/AppError.js';
import {
  IWaitingListService,
  ApplyToWaitingListData,
  OfferUnitData,
  RespondToOfferData,
  UpdateWaitingListStatusData,
  WaitingListQueryOptions,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

// Re-export interfaces for backward compatibility
export type {
  ApplyToWaitingListData,
  OfferUnitData,
  RespondToOfferData,
  UpdateWaitingListStatusData,
  WaitingListQueryOptions,
};

@injectable()
export class WaitingListService implements IWaitingListService {
  private waitingListModel: Model<IWaitingList>;
  private propertyModel: Model<IProperty>;
  private unitModel: Model<IUnit>;

  constructor(
    @inject(TYPES.WaitingListModel) waitingListModel: Model<IWaitingList>,
    @inject(TYPES.PropertyModel) propertyModel: Model<IProperty>,
    @inject(TYPES.UnitModel) unitModel: Model<IUnit>
  ) {
    this.waitingListModel = waitingListModel;
    this.propertyModel = propertyModel;
    this.unitModel = unitModel;
  }

  /**
   * Apply to waiting list for a property
   */
  async applyToWaitingList(data: ApplyToWaitingListData): Promise<IWaitingList> {
    const { applicantId, propertyId, unitId, type, application } = data;

    // Verify property exists and is listed
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(propertyId),
      isListed: true,
    });

    if (!property) {
      throw new NotFoundError('Property or property is not listed');
    }

    // Check if already in waiting list
    const existingEntry = await this.waitingListModel.findOne({
      propertyId: new Types.ObjectId(propertyId),
      applicantId: new Types.ObjectId(applicantId),
      status: { $in: ['waiting', 'offered'] },
    });

    if (existingEntry) {
      throw new ConflictError('You are already on the waiting list for this property');
    }

    // Determine type based on property setting
    let entryType = type || 'queue';
    if (property.waitingListType === 'queue') {
      entryType = 'queue';
    } else if (property.waitingListType === 'application') {
      entryType = 'application';
    }

    // Get position for queue type
    let position: number | undefined;
    if (entryType === 'queue') {
      const lastEntry = await this.waitingListModel.findOne({
        propertyId: new Types.ObjectId(propertyId),
        type: 'queue',
        status: 'waiting',
      }).sort({ position: -1 });

      position = lastEntry ? lastEntry.position! + 1 : 1;
    }

    // Create waiting list entry
    const entry = await this.waitingListModel.create({
      propertyId: new Types.ObjectId(propertyId),
      unitId: unitId ? new Types.ObjectId(unitId) : undefined,
      applicantId: new Types.ObjectId(applicantId),
      type: entryType,
      position,
      application: entryType === 'application' ? application : undefined,
      status: 'waiting',
      appliedAt: new Date(),
    });

    return entry;
  }

  /**
   * Get waiting list entries (owner only)
   */
  async getWaitingList(ownerId: string, options: WaitingListQueryOptions = {}) {
    const { propertyId, unitId, status, type, page = 1, limit = 20 } = options;

    // Get owner's properties
    const properties = await this.propertyModel.find({
      ownerId: new Types.ObjectId(ownerId),
    }).select('_id');

    const propertyIds = properties.map((p) => p._id);

    // Build query
    const query: any = { propertyId: { $in: propertyIds } };
    if (propertyId) query.propertyId = new Types.ObjectId(propertyId);
    if (unitId) query.unitId = new Types.ObjectId(unitId);
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      this.waitingListModel
        .find(query)
        .populate('propertyId', 'name address')
        .populate('unitId', 'unitNumber floor type pricing')
        .populate('applicantId', 'name email phone')
        .sort({ position: 1, appliedAt: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.waitingListModel.countDocuments(query),
    ]);

    return {
      entries,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Offer unit to waiting list applicant (owner only)
   */
  async offerUnit(data: OfferUnitData): Promise<IWaitingList> {
    const { entryId, ownerId, unitId, expiresInDays = 3 } = data;

    // Find entry
    const entry = await this.waitingListModel.findById(entryId);

    if (!entry) {
      throw new NotFoundError('Waiting list entry', entryId);
    }

    // Verify ownership
    const property = await this.propertyModel.findOne({
      _id: entry.propertyId,
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!property) {
      throw new ForbiddenError('Not authorized to manage this property');
    }

    // Verify unit is available
    const unit = await this.unitModel.findOne({
      _id: new Types.ObjectId(unitId),
      propertyId: entry.propertyId,
      status: 'vacant',
    });

    if (!unit) {
      throw new BadRequestError('Unit is not available');
    }

    // Update entry with offer
    entry.unitId = new Types.ObjectId(unitId);
    entry.status = 'offered';
    entry.offeredAt = new Date();
    entry.expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    await entry.save();

    // Reserve the unit
    await this.unitModel.findByIdAndUpdate(unitId, { status: 'reserved' });

    return entry;
  }

  /**
   * Respond to unit offer (applicant only)
   */
  async respondToOffer(data: RespondToOfferData): Promise<IWaitingList> {
    const { entryId, applicantId, accept } = data;

    // Find entry belonging to applicant
    const entry = await this.waitingListModel.findOne({
      _id: new Types.ObjectId(entryId),
      applicantId: new Types.ObjectId(applicantId),
      status: 'offered',
    });

    if (!entry) {
      throw new NotFoundError('Offer not found or already responded to');
    }

    // Check if offer expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      entry.status = 'expired';
      await entry.save();

      // Release the unit
      if (entry.unitId) {
        await this.unitModel.findByIdAndUpdate(entry.unitId, { status: 'vacant' });
      }

      throw new BadRequestError('Offer has expired');
    }

    // Update status based on response
    if (accept) {
      entry.status = 'accepted';
      // Note: Tenant creation should be handled separately by owner
    } else {
      entry.status = 'rejected';

      // Release the unit
      if (entry.unitId) {
        await this.unitModel.findByIdAndUpdate(entry.unitId, { status: 'vacant' });
      }
    }

    await entry.save();

    return entry;
  }

  /**
   * Update waiting list status (owner only)
   */
  async updateWaitingListStatus(data: UpdateWaitingListStatusData): Promise<IWaitingList> {
    const { entryId, ownerId, status, notes } = data;

    // Find entry
    const entry = await this.waitingListModel.findById(entryId);

    if (!entry) {
      throw new NotFoundError('Waiting list entry', entryId);
    }

    // Verify ownership
    const property = await this.propertyModel.findOne({
      _id: entry.propertyId,
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!property) {
      throw new ForbiddenError('Not authorized to manage this property');
    }

    // Update status
    entry.status = status as any;
    await entry.save();

    // If rejected/expired, free up unit if reserved
    if ((status === 'rejected' || status === 'expired') && entry.unitId) {
      const unit = await this.unitModel.findById(entry.unitId);
      if (unit && unit.status === 'reserved') {
        unit.status = 'vacant';
        await unit.save();
      }
    }

    return entry;
  }

  /**
   * Get user's own waiting list applications
   */
  async getMyApplications(applicantId: string): Promise<IWaitingList[]> {
    const applications = await this.waitingListModel
      .find({ applicantId: new Types.ObjectId(applicantId) })
      .populate('propertyId', 'name address type images')
      .populate('unitId', 'unitNumber floor type pricing')
      .sort({ appliedAt: -1 })
      .lean();

    return applications;
  }
}
