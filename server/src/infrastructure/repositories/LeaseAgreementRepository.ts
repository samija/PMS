import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { ILeaseAgreement, LeaseStatus } from '../../models/LeaseAgreement.js';
import TYPES from '../../config/types.js';

@injectable()
export class LeaseAgreementRepository extends BaseRepository<ILeaseAgreement> {
  constructor(@inject(TYPES.LeaseAgreementModel) model: Model<ILeaseAgreement>) {
    super(model);
  }

  async findByTenant(tenantId: string): Promise<ILeaseAgreement[]> {
    return this.model
      .find({ tenantId: this.toObjectId(tenantId) })
      .sort({ version: -1 })
      .exec();
  }

  async findActive(tenantId: string): Promise<ILeaseAgreement | null> {
    return this.model.findOne({ tenantId: this.toObjectId(tenantId), status: 'active' }).exec();
  }

  async findExpiringBefore(days: number): Promise<ILeaseAgreement[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return this.model
      .find({
        endDate: { $lte: cutoff },
        status: { $in: ['active'] },
      })
      .exec();
  }

  async findExpiredActive(): Promise<ILeaseAgreement[]> {
    return this.model
      .find({
        endDate: { $lt: new Date() },
        status: { $in: ['active', 'expiring_soon'] },
      })
      .exec();
  }
}
