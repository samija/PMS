import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';
import { ITenantAuditLogEntry } from '../../models/TenantAuditLog.js';
import TYPES from '../../config/types.js';

export interface AuditQuery {
  tenantId?: string;
  entityType?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

@injectable()
export class TenantAuditLogRepository {
  constructor(@inject(TYPES.TenantAuditLogModel) private model: Model<ITenantAuditLogEntry>) {}

  async append(entry: Omit<ITenantAuditLogEntry, '_id' | 'at'>): Promise<void> {
    await this.model.create({ ...entry, at: new Date() });
  }

  async find(
    query: AuditQuery,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: ITenantAuditLogEntry[]; total: number }> {
    const filter: any = {};
    if (query.tenantId) filter.tenantId = new Types.ObjectId(query.tenantId);
    if (query.entityType) filter.entityType = query.entityType;
    if (query.action) filter.action = query.action;
    if (query.from || query.to) {
      filter.at = {};
      if (query.from) filter.at.$gte = query.from;
      if (query.to) filter.at.$lte = query.to;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ at: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(filter),
    ]);

    return { data: data as unknown as ITenantAuditLogEntry[], total };
  }

  async purgeOlderThan(date: Date): Promise<number> {
    const result = await this.model.deleteMany({ at: { $lt: date } });
    return result.deletedCount;
  }
}
