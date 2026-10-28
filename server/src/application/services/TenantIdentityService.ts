import { injectable, inject } from 'inversify';
import TYPES from '../../config/types.js';
import { FieldEncryptionService } from '../../infrastructure/crypto/FieldEncryptionService.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  InvalidStateTransitionError,
} from '../../domain/exceptions/AppError.js';
import {
  IEncryptedField,
  IIdentityProfile,
  VerificationStatus,
  RejectionReasonCode,
  ITenant,
} from '../../types/index.js';
import { UpsertIdentityProfileDto } from '../dto/identity/UpsertIdentityProfileDto.js';
import { Model, Types } from 'mongoose';

const SENSITIVE_FIELDS = ['nationalIdNumber', 'passportNumber', 'incomeAmount'] as const;

const VALID_TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  not_started: ['pending'],
  pending: ['in_review'],
  in_review: ['verified', 'rejected', 'requires_resubmission'],
  verified: ['expired', 'requires_resubmission'],
  rejected: ['pending'],
  expired: ['pending'],
  requires_resubmission: ['pending'],
};

@injectable()
export class TenantIdentityService {
  constructor(
    @inject(TYPES.TenantModel) private tenantModel: Model<ITenant>,
    @inject(TYPES.FieldEncryption) private crypto: FieldEncryptionService
  ) {}

  async getIdentity(tenantId: string, viewerId: string, viewerRole: string) {
    const tenant = await this.tenantModel.findById(tenantId).populate('userId', 'name email phone');
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    this.assertCanView(tenant, viewerId, viewerRole);

    const profile = tenant.identityProfile ? this.decryptProfile(tenant.identityProfile) : null;

    return {
      tenantId: tenant._id,
      profile,
      verification: tenant.identityVerification,
    };
  }

  async updateIdentity(tenantId: string, dto: UpsertIdentityProfileDto, actorId: string, actorRole: string) {
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    this.assertCanEdit(tenant, actorId, actorRole);

    const profile = this.buildEncryptedProfile(dto, tenant.identityProfile);
    tenant.identityProfile = profile;

    const sensitiveChanged = this.didSensitiveFieldsChange(dto);
    if (sensitiveChanged && tenant.identityVerification?.status === 'verified') {
      tenant.identityVerification = {
        status: 'requires_resubmission',
        updatedAt: new Date(),
        updatedBy: new Types.ObjectId(actorId),
        reasonCode: 'other',
        reasonText: 'Identity profile was modified after verification',
      };
    }

    if (!tenant.identityVerification || tenant.identityVerification.status === 'not_started') {
      tenant.identityVerification = {
        status: 'pending',
        updatedAt: new Date(),
        updatedBy: new Types.ObjectId(actorId),
      };
    }

    await tenant.save();

    return {
      tenantId: tenant._id,
      profile: this.decryptProfile(tenant.identityProfile!),
      verification: tenant.identityVerification,
    };
  }

  async setVerificationStatus(
    tenantId: string,
    newStatus: VerificationStatus,
    actorId: string,
    actorRole: string,
    reasonCode?: RejectionReasonCode,
    reasonText?: string
  ) {
    if (actorRole !== 'owner' && actorRole !== 'admin') {
      throw new ForbiddenError('Only owners and admins can change verification status');
    }

    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant', tenantId);

    if (actorRole === 'owner' && tenant.ownerId.toString() !== actorId) {
      throw new ForbiddenError('You can only verify tenants of your own properties');
    }

    const currentStatus = tenant.identityVerification?.status || 'not_started';
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new InvalidStateTransitionError('identityVerification', currentStatus, newStatus);
    }

    if ((newStatus === 'rejected' || newStatus === 'requires_resubmission') && !reasonCode) {
      throw new BadRequestError('Rejection or resubmission requires a reason code');
    }

    tenant.identityVerification = {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: new Types.ObjectId(actorId),
      reasonCode: newStatus === 'rejected' || newStatus === 'requires_resubmission' ? reasonCode : undefined,
      reasonText: newStatus === 'rejected' || newStatus === 'requires_resubmission' ? reasonText : undefined,
    };

    await tenant.save();

    return {
      tenantId: tenant._id,
      verification: tenant.identityVerification,
    };
  }

  assertCanActivateTenant(tenant: ITenant, requireVerification: boolean) {
    if (!requireVerification) return;
    const status = tenant.identityVerification?.status;
    if (status !== 'verified') {
      throw new BadRequestError(
        `Cannot activate tenant: identity verification status is '${status || 'not_started'}', must be 'verified'`
      );
    }
  }

  private assertCanView(tenant: ITenant, viewerId: string, viewerRole: string) {
    if (viewerRole === 'admin') return;
    if (tenant.userId.toString() === viewerId) return;
    if (tenant.ownerId.toString() === viewerId) return;
    throw new ForbiddenError('You do not have access to this identity profile');
  }

  private assertCanEdit(tenant: ITenant, actorId: string, actorRole: string) {
    if (actorRole === 'admin') return;
    if (tenant.userId.toString() === actorId) return;
    if (actorRole === 'owner' && tenant.ownerId.toString() === actorId) return;
    throw new ForbiddenError('You do not have permission to edit this identity profile');
  }

  private buildEncryptedProfile(dto: UpsertIdentityProfileDto, existing?: IIdentityProfile): IIdentityProfile {
    const profile: IIdentityProfile = { ...(existing || {}) };

    if (dto.dateOfBirth !== undefined) profile.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.nationality !== undefined) profile.nationality = dto.nationality;
    if (dto.passportCountry !== undefined) profile.passportCountry = dto.passportCountry;
    if (dto.occupation !== undefined) profile.occupation = dto.occupation;
    if (dto.employer !== undefined) profile.employer = dto.employer;
    if (dto.employerPhone !== undefined) profile.employerPhone = dto.employerPhone;
    if (dto.incomeCurrency !== undefined) profile.incomeCurrency = dto.incomeCurrency;
    if (dto.incomeSource !== undefined) profile.incomeSource = dto.incomeSource;
    if (dto.permanentAddress !== undefined) profile.permanentAddress = dto.permanentAddress as any;
    if (dto.references !== undefined) profile.references = dto.references as any;
    if (dto.nextOfKin !== undefined) profile.nextOfKin = dto.nextOfKin as any;

    if (dto.nationalIdNumber !== undefined) {
      profile.nationalIdNumber = this.crypto.encrypt(dto.nationalIdNumber);
    }
    if (dto.passportNumber !== undefined) {
      profile.passportNumber = this.crypto.encrypt(dto.passportNumber);
    }
    if (dto.incomeAmount !== undefined) {
      profile.incomeAmount = this.crypto.encrypt(dto.incomeAmount);
    }

    return profile;
  }

  private decryptProfile(profile: IIdentityProfile): Record<string, any> {
    const result: Record<string, any> = { ...profile };

    for (const field of SENSITIVE_FIELDS) {
      const val = (profile as any)[field] as IEncryptedField | undefined;
      if (val && val.ciphertext) {
        result[field] = this.crypto.decrypt(val);
      } else {
        result[field] = undefined;
      }
    }

    return result;
  }

  private didSensitiveFieldsChange(dto: UpsertIdentityProfileDto): boolean {
    return dto.nationalIdNumber !== undefined || dto.passportNumber !== undefined || dto.incomeAmount !== undefined;
  }
}
