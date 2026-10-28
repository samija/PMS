import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { ITenantDocumentV2, DocumentTypeV2, DocVerificationStatus } from '../../models/TenantDocument.js';
import TYPES from '../../config/types.js';

export interface DocumentFilter {
  type?: DocumentTypeV2;
  verificationStatus?: DocVerificationStatus;
  includeDeleted?: boolean;
}

@injectable()
export class TenantDocumentRepository extends BaseRepository<ITenantDocumentV2> {
  constructor(@inject(TYPES.TenantDocumentModel) model: Model<ITenantDocumentV2>) {
    super(model);
  }

  async findByTenant(tenantId: string, filter?: DocumentFilter): Promise<ITenantDocumentV2[]> {
    const query: any = { tenantId: this.toObjectId(tenantId) };
    if (!filter?.includeDeleted) query.deletedAt = null;
    if (filter?.type) query.type = filter.type;
    if (filter?.verificationStatus) query.verificationStatus = filter.verificationStatus;
    return this.model.find(query).sort({ type: 1, version: -1 }).exec();
  }

  async findLatestCanonical(tenantId: string, type: DocumentTypeV2): Promise<ITenantDocumentV2 | null> {
    return this.model
      .findOne({
        tenantId: this.toObjectId(tenantId),
        type,
        deletedAt: null,
      })
      .sort({ version: -1 })
      .exec();
  }

  async findExpiringBefore(date: Date): Promise<ITenantDocumentV2[]> {
    return this.model
      .find({
        expiryDate: { $lte: date },
        verificationStatus: { $nin: ['expired', 'rejected'] },
        deletedAt: null,
      })
      .exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(this.toObjectId(id), { deletedAt: new Date() });
  }
}
