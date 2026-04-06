import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IMaintenance, ITenant, IProperty, IPropertyStaff } from '../../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../domain/exceptions/AppError.js';
import {
  IMaintenanceService,
  CreateMaintenanceRequestData,
  UpdateMaintenanceStatusData,
  AssignTechnicianData,
  CompleteMaintenanceData,
  SubmitFeedbackData,
  MaintenanceQueryOptions,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

// Re-export interfaces for backward compatibility
export type {
  CreateMaintenanceRequestData,
  UpdateMaintenanceStatusData,
  AssignTechnicianData,
  CompleteMaintenanceData,
  SubmitFeedbackData,
  MaintenanceQueryOptions,
};

@injectable()
export class MaintenanceService implements IMaintenanceService {
  private maintenanceModel: Model<IMaintenance>;
  private tenantModel: Model<ITenant>;
  private propertyModel: Model<IProperty>;
  private propertyStaffModel: Model<IPropertyStaff>;

  constructor(
    @inject(TYPES.MaintenanceModel) maintenanceModel: Model<IMaintenance>,
    @inject(TYPES.TenantModel) tenantModel: Model<ITenant>,
    @inject(TYPES.PropertyModel) propertyModel: Model<IProperty>,
    @inject(TYPES.PropertyStaffModel) propertyStaffModel: Model<IPropertyStaff>
  ) {
    this.maintenanceModel = maintenanceModel;
    this.tenantModel = tenantModel;
    this.propertyModel = propertyModel;
    this.propertyStaffModel = propertyStaffModel;
  }

  /**
   * Create maintenance request (tenant only)
   */
  async createMaintenanceRequest(data: CreateMaintenanceRequestData): Promise<IMaintenance> {
    const { userId, title, description, category, priority, images } = data;

    // Get active tenant info
    const tenant = await this.tenantModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!tenant) {
      throw new NotFoundError('Active tenancy');
    }

    // Create maintenance request
    const maintenance = await this.maintenanceModel.create({
      propertyId: tenant.propertyId,
      unitId: tenant.unitId,
      tenantId: tenant._id,
      ownerId: tenant.ownerId,
      title,
      description,
      category,
      priority: priority || 'medium',
      images: images || [],
      status: 'submitted',
      timeline: [
        {
          status: 'submitted',
          timestamp: new Date(),
          updatedBy: new Types.ObjectId(userId),
        },
      ],
    });

    return maintenance;
  }

  /**
   * Get maintenance requests with role-based filtering
   */
  async getMaintenanceRequests(
    userId: string,
    userRole: string,
    options: MaintenanceQueryOptions = {}
  ) {
    const { page = 1, limit = 10, status, priority, category, propertyId } = options;

    // Build query based on user role
    const query: any = {};

    if (userRole === 'admin') {
      // Admin sees all maintenance requests
    } else if (userRole === 'owner') {
      query.ownerId = new Types.ObjectId(userId);
    } else if (userRole === 'tenant') {
      // Tenant sees only their own requests
      const tenant = await this.tenantModel.findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      });

      if (tenant) {
        query.tenantId = tenant._id;
      } else {
        // No active tenancy, return empty
        return {
          requests: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit),
            pages: 0,
          },
        };
      }
    } else if (userRole === 'technician') {
      // Technician sees assigned requests
      query.assignedTo = new Types.ObjectId(userId);
    } else if (userRole === 'manager' || userRole === 'marketing') {
      // Staff see requests for properties they manage
      const staffAssignments = await this.propertyStaffModel.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      const propertyIds = staffAssignments.map((s) => s.propertyId);
      query.propertyId = { $in: propertyIds };
    }

    // Apply additional filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (propertyId) query.propertyId = new Types.ObjectId(propertyId);

    const skip = (Number(page) - 1) * Number(limit);

    const [requests, total] = await Promise.all([
      this.maintenanceModel
        .find(query)
        .populate('propertyId', 'name address')
        .populate('unitId', 'unitNumber floor')
        .populate('tenantId')
        .populate('assignedTo', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.maintenanceModel.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Get single maintenance request with full details
   */
  async getMaintenanceRequest(requestId: string): Promise<IMaintenance> {
    const request = await this.maintenanceModel
      .findById(requestId)
      .populate('propertyId', 'name address')
      .populate('unitId', 'unitNumber floor type')
      .populate('tenantId')
      .populate('assignedTo', 'name email phone')
      .populate('timeline.updatedBy', 'name')
      .lean();

    if (!request) {
      throw new NotFoundError('Maintenance request', requestId);
    }

    return request;
  }

  /**
   * Update maintenance request status
   */
  async updateMaintenanceStatus(data: UpdateMaintenanceStatusData): Promise<IMaintenance> {
    const { requestId, userId, status, note } = data;

    const request = await this.maintenanceModel.findById(requestId);

    if (!request) {
      throw new NotFoundError('Maintenance request', requestId);
    }

    // Update status and add timeline entry
    request.status = status as any;
    request.timeline.push({
      status: status as any,
      timestamp: new Date(),
      note,
      updatedBy: new Types.ObjectId(userId),
    });

    // Set completion timestamp if completed
    if (status === 'completed') {
      request.completedAt = new Date();
    }

    await request.save();

    return request;
  }

  /**
   * Assign technician to maintenance request (owner only)
   */
  async assignTechnician(data: AssignTechnicianData): Promise<IMaintenance> {
    const { requestId, ownerId, technicianId, scheduledDate, estimatedCost, note } = data;

    // Verify owner owns this request
    const request = await this.maintenanceModel.findOne({
      _id: new Types.ObjectId(requestId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!request) {
      throw new NotFoundError('Maintenance request', requestId);
    }

    // Update request with technician assignment
    request.assignedTo = new Types.ObjectId(technicianId);
    request.status = 'assigned';
    request.scheduledDate = scheduledDate ? new Date(scheduledDate) : undefined;
    request.estimatedCost = estimatedCost;

    // Add timeline entry
    request.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      note: note || 'Assigned to technician',
      updatedBy: new Types.ObjectId(ownerId),
    });

    await request.save();

    return request;
  }

  /**
   * Complete maintenance request
   */
  async completeMaintenanceRequest(data: CompleteMaintenanceData): Promise<IMaintenance> {
    const { requestId, userId, actualCost, completionImages, note } = data;

    const request = await this.maintenanceModel.findById(requestId);

    if (!request) {
      throw new NotFoundError('Maintenance request', requestId);
    }

    // Update request as completed
    request.status = 'completed';
    request.completedAt = new Date();
    request.actualCost = actualCost;
    request.completionImages = completionImages || [];

    // Add timeline entry
    request.timeline.push({
      status: 'completed',
      timestamp: new Date(),
      note: note || 'Work completed',
      updatedBy: new Types.ObjectId(userId),
    });

    await request.save();

    return request;
  }

  /**
   * Submit tenant feedback (tenant only)
   */
  async submitFeedback(data: SubmitFeedbackData): Promise<IMaintenance> {
    const { requestId, userId, rating, feedback } = data;

    // Verify tenant owns this request
    const tenant = await this.tenantModel.findOne({
      userId: new Types.ObjectId(userId),
      status: 'active',
    });

    if (!tenant) {
      throw new ForbiddenError('Not authorized');
    }

    // Find completed request belonging to tenant
    const request = await this.maintenanceModel.findOne({
      _id: new Types.ObjectId(requestId),
      tenantId: tenant._id,
      status: 'completed',
    });

    if (!request) {
      throw new NotFoundError('Completed maintenance request', requestId);
    }

    // Update feedback
    request.tenantRating = rating;
    request.tenantFeedback = feedback;

    await request.save();

    return request;
  }

  /**
   * Get maintenance statistics (owner dashboard)
   */
  async getMaintenanceStats(ownerId: string) {
    // Stats by status
    const byStatus = await this.maintenanceModel.aggregate([
      { $match: { ownerId: new Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Stats by priority (only active requests)
    const byPriority = await this.maintenanceModel.aggregate([
      {
        $match: {
          ownerId: new Types.ObjectId(ownerId),
          status: { $nin: ['completed', 'cancelled'] },
        },
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Stats by category
    const byCategory = await this.maintenanceModel.aggregate([
      { $match: { ownerId: new Types.ObjectId(ownerId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalCost: { $sum: '$actualCost' },
        },
      },
    ]);

    return {
      byStatus,
      byPriority,
      byCategory,
    };
  }
}
