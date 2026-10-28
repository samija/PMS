import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';
import TYPES from '../../config/types.js';
import { LeaseAgreementRepository } from '../../infrastructure/repositories/LeaseAgreementRepository.js';
import { LeaseTemplateService } from './LeaseTemplateService.js';
import { PdfLibLeaseRenderer } from '../../infrastructure/pdf/PdfLibLeaseRenderer.js';
import { ClickToAcceptSignatureProvider } from '../../infrastructure/signature/ClickToAcceptSignatureProvider.js';
import { TenantDocumentService } from './TenantDocumentService.js';
import { ILeaseAgreement, LeaseStatus, TerminationReasonCode } from '../../models/LeaseAgreement.js';
import { ITenant, IUnit } from '../../types/index.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  InvalidStateTransitionError,
} from '../../domain/exceptions/AppError.js';

const VALID_LEASE_TRANSITIONS: Record<LeaseStatus, LeaseStatus[]> = {
  draft: ['pending_owner_signature'],
  pending_owner_signature: ['pending_tenant_signature'],
  pending_tenant_signature: ['active'],
  active: ['expiring_soon', 'terminated', 'renewed'],
  expiring_soon: ['expired', 'terminated', 'renewed'],
  expired: ['renewed'],
  renewed: [],
  terminated: [],
};

@injectable()
export class LeaseAgreementService {
  constructor(
    @inject(TYPES.LeaseAgreementRepository) private leaseRepo: LeaseAgreementRepository,
    @inject(TYPES.LeaseTemplateService) private templateService: LeaseTemplateService,
    @inject(TYPES.PdfRenderer) private pdfRenderer: PdfLibLeaseRenderer,
    @inject(TYPES.SignatureProvider) private signatureProvider: ClickToAcceptSignatureProvider,
    @inject(TYPES.TenantModel) private tenantModel: Model<ITenant>,
    @inject(TYPES.UnitModel) private unitModel: Model<IUnit>
  ) {}

  async createDraft(input: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    ownerId: string;
    templateId: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    depositAmount: number;
    currency?: string;
    terms?: Record<string, string>;
  }): Promise<ILeaseAgreement> {
    await this.templateService.findById(input.templateId);
    const existing = await this.leaseRepo.findByTenant(input.tenantId);
    const version = existing.length > 0 ? Math.max(...existing.map((l) => l.version)) + 1 : 1;

    return this.leaseRepo.create({
      tenantId: new Types.ObjectId(input.tenantId),
      propertyId: new Types.ObjectId(input.propertyId),
      unitId: new Types.ObjectId(input.unitId),
      ownerId: new Types.ObjectId(input.ownerId),
      templateId: new Types.ObjectId(input.templateId),
      version,
      status: 'draft',
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      monthlyRent: input.monthlyRent,
      depositAmount: input.depositAmount,
      currency: input.currency || 'ETB',
      terms: input.terms || {},
    } as any);
  }

  async getById(id: string): Promise<ILeaseAgreement> {
    const lease = await this.leaseRepo.findById(id);
    if (!lease) throw new NotFoundError('LeaseAgreement', id);
    return lease;
  }

  async listByOwner(ownerId: string): Promise<ILeaseAgreement[]> {
    return this.leaseRepo.findAll({ ownerId: new Types.ObjectId(ownerId) });
  }

  async updateDraft(id: string, ownerId: string, patch: Partial<ILeaseAgreement>): Promise<ILeaseAgreement> {
    const lease = await this.getById(id);
    if (lease.status !== 'draft') throw new BadRequestError('Can only edit a draft lease');
    if (lease.ownerId.toString() !== ownerId) throw new ForbiddenError('Not your lease');
    return this.leaseRepo.update(id, patch) as Promise<ILeaseAgreement>;
  }

  async submitForSignature(id: string, ownerId: string): Promise<ILeaseAgreement> {
    const lease = await this.getById(id);
    if (lease.ownerId.toString() !== ownerId) throw new ForbiddenError('Not your lease');
    this.assertTransition(lease.status, 'pending_owner_signature');

    const template = await this.templateService.findById(lease.templateId!.toString());
    const placeholders = {
      ownerName: ownerId,
      tenantName: lease.tenantId.toString(),
      startDate: lease.startDate.toISOString().split('T')[0],
      endDate: lease.endDate.toISOString().split('T')[0],
      monthlyRent: lease.monthlyRent.toString(),
      deposit: lease.depositAmount.toString(),
      currency: lease.currency,
      ...lease.terms,
    };

    const { pdf, sha256 } = await this.pdfRenderer.render({ template, placeholders });

    return this.leaseRepo.update(id, {
      status: 'pending_owner_signature',
      generatedPdfSha256: sha256,
    }) as Promise<ILeaseAgreement>;
  }

  async sign(
    id: string,
    side: 'owner' | 'tenant',
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<ILeaseAgreement> {
    const lease = await this.getById(id);

    if (side === 'owner') {
      this.assertTransition(lease.status, 'pending_tenant_signature');
      if (lease.ownerId.toString() !== userId) throw new ForbiddenError('Only the owner can sign as owner');
    } else {
      this.assertTransition(lease.status, 'active');
      const tenant = await this.tenantModel.findById(lease.tenantId);
      if (!tenant || tenant.userId.toString() !== userId)
        throw new ForbiddenError('Only the tenant can sign as tenant');
    }

    if (!lease.generatedPdfSha256) throw new BadRequestError('No PDF generated for this lease');

    const signature = this.signatureProvider.sign({
      userId,
      docSha256: lease.generatedPdfSha256,
      ip,
      userAgent,
    });

    const update: any = {};
    if (side === 'owner') {
      update.ownerSignature = signature;
      update.status = 'pending_tenant_signature';
    } else {
      update.tenantSignature = signature;
      update.status = 'active';
    }

    const updated = (await this.leaseRepo.update(id, update)) as ILeaseAgreement;

    if (update.status === 'active') {
      await this.activateLease(updated);
    }

    return updated;
  }

  async terminate(
    id: string,
    ownerId: string,
    reasonCode: TerminationReasonCode,
    reasonText?: string
  ): Promise<ILeaseAgreement> {
    const lease = await this.getById(id);
    if (lease.ownerId.toString() !== ownerId) throw new ForbiddenError('Not your lease');
    this.assertTransition(lease.status, 'terminated');

    const updated = (await this.leaseRepo.update(id, {
      status: 'terminated',
      terminationReasonCode: reasonCode,
      terminationReasonText: reasonText,
      terminatedAt: new Date(),
    })) as ILeaseAgreement;

    await this.unitModel.findByIdAndUpdate(lease.unitId, {
      status: 'vacant',
      currentTenantId: null,
      leaseStart: null,
      leaseEnd: null,
    });

    return updated;
  }

  async renew(id: string, ownerId: string): Promise<ILeaseAgreement> {
    const lease = await this.getById(id);
    if (lease.ownerId.toString() !== ownerId) throw new ForbiddenError('Not your lease');

    const draft = await this.leaseRepo.create({
      tenantId: lease.tenantId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      ownerId: lease.ownerId,
      templateId: lease.templateId,
      version: lease.version + 1,
      parentLeaseId: lease._id,
      status: 'draft',
      startDate: lease.endDate,
      endDate: new Date(lease.endDate.getTime() + (lease.endDate.getTime() - lease.startDate.getTime())),
      monthlyRent: lease.monthlyRent,
      depositAmount: lease.depositAmount,
      currency: lease.currency,
      terms: lease.terms,
    } as any);

    return draft;
  }

  async amend(
    id: string,
    ownerId: string,
    patch: { monthlyRent?: number; endDate?: string; terms?: Record<string, string> }
  ): Promise<ILeaseAgreement> {
    const lease = await this.getById(id);
    if (lease.ownerId.toString() !== ownerId) throw new ForbiddenError('Not your lease');

    const draft = await this.leaseRepo.create({
      tenantId: lease.tenantId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      ownerId: lease.ownerId,
      templateId: lease.templateId,
      version: lease.version + 1,
      parentLeaseId: lease._id,
      status: 'draft',
      startDate: lease.startDate,
      endDate: patch.endDate ? new Date(patch.endDate) : lease.endDate,
      monthlyRent: patch.monthlyRent ?? lease.monthlyRent,
      depositAmount: lease.depositAmount,
      currency: lease.currency,
      terms: { ...lease.terms, ...(patch.terms || {}) },
    } as any);

    return draft;
  }

  async autoExpireDue(): Promise<number> {
    const leases = await this.leaseRepo.findExpiredActive();
    let count = 0;
    for (const lease of leases) {
      await this.leaseRepo.update(lease._id.toString(), { status: 'expired' });
      count++;
    }
    return count;
  }

  async flagExpiringSoon(daysWindow: number = 60): Promise<number> {
    const leases = await this.leaseRepo.findExpiringBefore(daysWindow);
    let count = 0;
    for (const lease of leases) {
      if (lease.status === 'active') {
        await this.leaseRepo.update(lease._id.toString(), { status: 'expiring_soon' });
        count++;
      }
    }
    return count;
  }

  private async activateLease(lease: ILeaseAgreement) {
    await this.tenantModel.findByIdAndUpdate(lease.tenantId, {
      'leaseAgreement.startDate': lease.startDate,
      'leaseAgreement.endDate': lease.endDate,
      'leaseAgreement.monthlyRent': lease.monthlyRent,
      'leaseAgreement.deposit': lease.depositAmount,
      status: 'active',
    });

    await this.unitModel.findByIdAndUpdate(lease.unitId, {
      status: 'occupied',
      currentTenantId: lease.tenantId,
      leaseStart: lease.startDate,
      leaseEnd: lease.endDate,
    });

    if (lease.parentLeaseId) {
      await this.leaseRepo.update(lease.parentLeaseId.toString(), { status: 'renewed' });
    }
  }

  private assertTransition(from: LeaseStatus, to: LeaseStatus) {
    const allowed = VALID_LEASE_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new InvalidStateTransitionError('LeaseAgreement', from, to);
    }
  }
}
