import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IUser, ITenant, IUnit, IProperty, ILeaseAgreement, IEmergencyContact, ITenantDocument, DocumentType } from '../../types/index.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import { deleteCloudinaryImage } from '../../middleware/upload.js';
import {
  ITenantService,
  CreateTenantData,
  UpdateTenantData,
  TenantQueryOptions,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

// Re-export interfaces for backward compatibility
export type { CreateTenantData, UpdateTenantData, TenantQueryOptions };

@injectable()
export class TenantService implements ITenantService {
  private userModel: Model<IUser>;
  private tenantModel: Model<ITenant>;
  private unitModel: Model<IUnit>;
  private propertyModel: Model<IProperty>;

  constructor(
    @inject(TYPES.UserModel) userModel: Model<IUser>,
    @inject(TYPES.TenantModel) tenantModel: Model<ITenant>,
    @inject(TYPES.UnitModel) unitModel: Model<IUnit>,
    @inject(TYPES.PropertyModel) propertyModel: Model<IProperty>
  ) {
    this.userModel = userModel;
    this.tenantModel = tenantModel;
    this.unitModel = unitModel;
    this.propertyModel = propertyModel;
  }

  async createTenant(data: CreateTenantData): Promise<ITenant> {
    const { email, name, phone, propertyId, unitId, ownerId, leaseAgreement, emergencyContact } = data;

    // Verify property ownership
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(propertyId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    // Verify unit belongs to property and is available
    const unit = await this.unitModel.findOne({
      _id: new Types.ObjectId(unitId),
      propertyId: new Types.ObjectId(propertyId),
    });

    if (!unit) {
      throw new NotFoundError('Unit', unitId);
    }

    if (unit.status !== 'vacant' && unit.status !== 'reserved') {
      throw new BadRequestError('Unit is not available');
    }

    // Check if user exists or create new one
    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        email,
        name,
        phone,
        role: 'tenant',
        authProvider: 'local',
        isVerified: false,
      });
    }

    // Create tenant record
    const tenant = await this.tenantModel.create({
      userId: user._id,
      propertyId: new Types.ObjectId(propertyId),
      unitId: new Types.ObjectId(unitId),
      ownerId: new Types.ObjectId(ownerId),
      leaseAgreement: {
        ...leaseAgreement,
        startDate: new Date(leaseAgreement.startDate),
        endDate: new Date(leaseAgreement.endDate),
      },
      emergencyContact,
      status: 'active',
    });

    // Update unit status
    await this.unitModel.findByIdAndUpdate(unitId, {
      status: 'occupied',
      currentTenantId: tenant._id,
      leaseStart: new Date(leaseAgreement.startDate),
      leaseEnd: new Date(leaseAgreement.endDate),
    });

    return tenant;
  }

  async getTenants(ownerId: string, options: TenantQueryOptions = {}) {
    const { page = 1, limit = 10, status, propertyId } = options;

    const query: any = { ownerId: new Types.ObjectId(ownerId) };
    if (status) query.status = status;
    if (propertyId) query.propertyId = new Types.ObjectId(propertyId);

    const skip = (Number(page) - 1) * Number(limit);

    const [tenants, total] = await Promise.all([
      this.tenantModel
        .find(query)
        .populate('userId', 'name email phone avatar')
        .populate('propertyId', 'name address')
        .populate('unitId', 'unitNumber floor type pricing')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      this.tenantModel.countDocuments(query),
    ]);

    return {
      tenants,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getTenant(tenantId: string, ownerId: string): Promise<ITenant> {
    const tenant = await this.tenantModel
      .findOne({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      })
      .populate('userId', 'name email phone avatar')
      .populate('propertyId', 'name address type')
      .populate('unitId', 'unitNumber floor type pricing features')
      .lean();

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    return tenant;
  }

  async updateTenant(
    tenantId: string,
    ownerId: string,
    data: UpdateTenantData
  ): Promise<ITenant> {
    const tenant = await this.tenantModel.findOne({
      _id: new Types.ObjectId(tenantId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // Update fields
    if (data.leaseAgreement) {
      tenant.leaseAgreement = {
        ...tenant.leaseAgreement,
        ...data.leaseAgreement,
      } as ILeaseAgreement;
    }

    if (data.emergencyContact) {
      tenant.emergencyContact = data.emergencyContact as IEmergencyContact;
    }

    if (data.status) {
      tenant.status = data.status as any;
    }

    await tenant.save();

    // Update unit lease dates if changed
    if (data.leaseAgreement?.startDate || data.leaseAgreement?.endDate) {
      await this.unitModel.findByIdAndUpdate(tenant.unitId, {
        leaseStart: tenant.leaseAgreement.startDate,
        leaseEnd: tenant.leaseAgreement.endDate,
      });
    }

    return tenant;
  }

  async terminateTenant(tenantId: string, ownerId: string): Promise<ITenant> {
    const tenant = await this.tenantModel.findOne({
      _id: new Types.ObjectId(tenantId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    // Update tenant status
    tenant.status = 'terminated';
    await tenant.save();

    // Free up the unit
    await this.unitModel.findByIdAndUpdate(tenant.unitId, {
      status: 'vacant',
      currentTenantId: null,
      leaseStart: null,
      leaseEnd: null,
    });

    return tenant;
  }

  // Tenant Portal Methods
  async getMyTenancy(userId: string): Promise<ITenant> {
    const tenant = await this.tenantModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      })
      .populate('propertyId', 'name address type amenities images')
      .populate('unitId', 'unitNumber floor type pricing features')
      .populate('ownerId', 'name email phone')
      .lean();

    if (!tenant) {
      throw new NotFoundError('Active tenancy');
    }

    return tenant;
  }

  // Document Management Methods
  async addDocument(
    tenantId: string,
    ownerId: string,
    documentData: { url: string; type: DocumentType; name: string }
  ): Promise<ITenant> {
    const tenant = await this.tenantModel.findOne({
      _id: new Types.ObjectId(tenantId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    const newDocument: ITenantDocument = {
      url: documentData.url,
      type: documentData.type,
      name: documentData.name,
      uploadedAt: new Date(),
    };

    tenant.documents.push(newDocument as any);
    await tenant.save();

    return tenant;
  }

  async getDocuments(tenantId: string, ownerId: string): Promise<ITenantDocument[]> {
    const tenant = await this.tenantModel
      .findOne({
        _id: new Types.ObjectId(tenantId),
        ownerId: new Types.ObjectId(ownerId),
      })
      .select('documents')
      .lean();

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    return tenant.documents || [];
  }

  async deleteDocument(
    tenantId: string,
    documentId: string,
    ownerId: string
  ): Promise<ITenant> {
    const tenant = await this.tenantModel.findOne({
      _id: new Types.ObjectId(tenantId),
      ownerId: new Types.ObjectId(ownerId),
    });

    if (!tenant) {
      throw new NotFoundError('Tenant', tenantId);
    }

    const docIndex = tenant.documents.findIndex(
      (doc: any) => doc._id?.toString() === documentId
    );

    if (docIndex === -1) {
      throw new NotFoundError('Document', documentId);
    }

    const docToDelete = tenant.documents[docIndex] as any;

    // Delete from Cloudinary
    try {
      await deleteCloudinaryImage(docToDelete.url);
    } catch (error) {
      console.error('Failed to delete document from Cloudinary:', error);
    }

    tenant.documents.splice(docIndex, 1);
    await tenant.save();

    return tenant;
  }
}
