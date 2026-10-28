import { injectable, inject } from 'inversify';
import crypto from 'crypto';
import { Types } from 'mongoose';
import TYPES from '../../config/types.js';
import {
  TenantDocumentRepository,
  DocumentFilter,
} from '../../infrastructure/repositories/TenantDocumentRepository.js';
import { CloudinaryObjectStorage } from '../../infrastructure/storage/CloudinaryObjectStorage.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../domain/exceptions/AppError.js';
import {
  ITenantDocumentV2,
  DocumentTypeV2,
  DocVerificationStatus,
  isSensitiveType,
} from '../../models/TenantDocument.js';
import { ITenant } from '../../types/index.js';
import { Model } from 'mongoose';

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

const PUBLIC_FOLDER = 'enderase/tenant-documents';
const SENSITIVE_FOLDER = 'enderase/tenant-documents-sensitive';

@injectable()
export class TenantDocumentService {
  constructor(
    @inject(TYPES.TenantDocumentRepository) private docRepo: TenantDocumentRepository,
    @inject(TYPES.CloudinaryObjectStorage) private storage: CloudinaryObjectStorage,
    @inject(TYPES.TenantModel) private tenantModel: Model<ITenant>
  ) {}

  async upload(
    tenantId: string,
    fileBuffer: Buffer,
    mimeType: string,
    dto: {
      type: DocumentTypeV2;
      name: string;
      issueDate?: string;
      expiryDate?: string;
      documentNumber?: string;
      issuingCountry?: string;
    },
    actorId: string,
    actorRole: string
  ): Promise<ITenantDocumentV2> {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);
    this.assertCanManageDocs(tenant, actorId, actorRole);

    if (!ALLOWED_MIMES.includes(mimeType)) {
      throw new BadRequestError(`Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIMES.join(', ')}`);
    }
    if (fileBuffer.length > MAX_SIZE) {
      throw new BadRequestError(`File too large (${fileBuffer.length} bytes). Maximum: ${MAX_SIZE} bytes`);
    }

    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const sensitive = isSensitiveType(dto.type);
    const filename = `${tenantId}_${dto.type}_${Date.now()}`;

    const uploadResult = sensitive
      ? await this.storage.uploadSensitive(fileBuffer, SENSITIVE_FOLDER, filename, mimeType)
      : await this.storage.uploadPublic(fileBuffer, PUBLIC_FOLDER, filename, mimeType);

    const existing = await this.docRepo.findLatestCanonical(tenantId, dto.type);
    const version = existing ? existing.version + 1 : 1;

    const doc = await this.docRepo.create({
      tenantId: new Types.ObjectId(tenantId),
      type: dto.type,
      name: dto.name,
      url: uploadResult.url,
      storageRef: uploadResult.storageRef,
      sensitivity: sensitive ? 'sensitive' : 'public',
      mimeType,
      fileSizeBytes: fileBuffer.length,
      sha256,
      version,
      previousVersionId: existing?._id,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      documentNumber: dto.documentNumber,
      issuingCountry: dto.issuingCountry,
      verificationStatus: 'pending',
      uploadedBy: new Types.ObjectId(actorId),
      uploadedAt: new Date(),
    } as any);

    await this.syncLegacyDocuments(tenantId, doc);

    return doc;
  }

  async listDocuments(tenantId: string, filter: DocumentFilter | undefined, viewerId: string, viewerRole: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);
    this.assertCanViewDocs(tenant, viewerId, viewerRole);
    return this.docRepo.findByTenant(tenantId, filter);
  }

  async getSignedUrl(documentId: string, viewerId: string, viewerRole: string): Promise<string> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc || doc.deletedAt) throw new NotFoundError('Document', documentId);

    const tenant = await this.tenantModel.findById(doc.tenantId);
    if (!tenant) throw new NotFoundError('Tenant', doc.tenantId.toString());
    this.assertCanViewDocs(tenant, viewerId, viewerRole);

    if (doc.sensitivity === 'public' && doc.url) return doc.url;
    return this.storage.getSignedUrl(doc.storageRef, 900);
  }

  async verify(documentId: string, actorId: string, actorRole: string): Promise<ITenantDocumentV2> {
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      throw new ForbiddenError('Only owners and admins can verify documents');
    }
    const doc = await this.docRepo.findById(documentId);
    if (!doc || doc.deletedAt) throw new NotFoundError('Document', documentId);

    if (!['pending', 'in_review'].includes(doc.verificationStatus)) {
      throw new BadRequestError(`Cannot verify document in '${doc.verificationStatus}' status`);
    }

    return this.docRepo.update(documentId, {
      verificationStatus: 'verified',
      verifiedBy: new Types.ObjectId(actorId),
      verifiedAt: new Date(),
    }) as Promise<ITenantDocumentV2>;
  }

  async reject(
    documentId: string,
    reasonCode: string,
    reasonText: string | undefined,
    actorId: string,
    actorRole: string
  ): Promise<ITenantDocumentV2> {
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      throw new ForbiddenError('Only owners and admins can reject documents');
    }
    const doc = await this.docRepo.findById(documentId);
    if (!doc || doc.deletedAt) throw new NotFoundError('Document', documentId);

    if (!['pending', 'in_review'].includes(doc.verificationStatus)) {
      throw new BadRequestError(`Cannot reject document in '${doc.verificationStatus}' status`);
    }

    return this.docRepo.update(documentId, {
      verificationStatus: 'rejected',
      rejectionReasonCode: reasonCode,
      rejectionReasonText: reasonText,
      verifiedBy: new Types.ObjectId(actorId),
      verifiedAt: new Date(),
    }) as Promise<ITenantDocumentV2>;
  }

  async softDeleteDocument(documentId: string, actorId: string, actorRole: string): Promise<void> {
    const doc = await this.docRepo.findById(documentId);
    if (!doc || doc.deletedAt) throw new NotFoundError('Document', documentId);

    const tenant = await this.tenantModel.findById(doc.tenantId);
    if (!tenant) throw new NotFoundError('Tenant', doc.tenantId.toString());
    this.assertCanManageDocs(tenant, actorId, actorRole);

    await this.docRepo.softDelete(documentId);
  }

  async expireDueDocuments(): Promise<number> {
    const now = new Date();
    const docs = await this.docRepo.findExpiringBefore(now);
    let count = 0;
    for (const doc of docs) {
      if (doc.verificationStatus !== 'expired') {
        await this.docRepo.update(doc._id.toString(), { verificationStatus: 'expired' });
        count++;
      }
    }
    return count;
  }

  private async syncLegacyDocuments(tenantId: string, doc: ITenantDocumentV2) {
    const legacyType = this.toLegacyType(doc.type);
    if (!legacyType) return;

    await this.tenantModel.findByIdAndUpdate(tenantId, {
      $push: {
        documents: {
          url: doc.url || doc.storageRef,
          type: legacyType,
          name: doc.name,
          uploadedAt: doc.uploadedAt,
        },
      },
    });
  }

  private toLegacyType(type: DocumentTypeV2): string | null {
    const mapping: Record<string, string> = {
      agreement: 'agreement',
      national_id: 'national_id',
      passport: 'passport',
    };
    return mapping[type] || 'other';
  }

  private assertCanViewDocs(tenant: ITenant, viewerId: string, viewerRole: string) {
    if (viewerRole === 'admin') return;
    if (tenant.userId.toString() === viewerId) return;
    if (tenant.ownerId.toString() === viewerId) return;
    throw new ForbiddenError('You do not have access to these documents');
  }

  private assertCanManageDocs(tenant: ITenant, actorId: string, actorRole: string) {
    if (actorRole === 'admin') return;
    if (tenant.userId.toString() === actorId) return;
    if (actorRole === 'owner' && tenant.ownerId.toString() === actorId) return;
    throw new ForbiddenError('You do not have permission to manage documents for this tenant');
  }
}
