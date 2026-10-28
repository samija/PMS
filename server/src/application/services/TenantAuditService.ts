import { injectable, inject } from 'inversify';
import { Types } from 'mongoose';
import TYPES from '../../config/types.js';
import { TenantAuditLogRepository, AuditQuery } from '../../infrastructure/repositories/TenantAuditLogRepository.js';

@injectable()
export class TenantAuditService {
  constructor(@inject(TYPES.TenantAuditLogRepository) private repo: TenantAuditLogRepository) {}

  async record(params: {
    actorId: string;
    actorRole: string;
    action: string;
    entityType: 'identity' | 'document' | 'lease' | 'verification' | 'tenant';
    entityId: string;
    tenantId?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    reasonCode?: string;
    note?: string;
    correlationId?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    const sanitized = this.redactSensitive(params.before, params.after);
    await this.repo.append({
      actorId: new Types.ObjectId(params.actorId),
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: new Types.ObjectId(params.entityId),
      tenantId: params.tenantId ? new Types.ObjectId(params.tenantId) : undefined,
      before: sanitized.before,
      after: sanitized.after,
      reasonCode: params.reasonCode,
      note: params.note,
      correlationId: params.correlationId,
      ip: params.ip,
      userAgent: params.userAgent?.slice(0, 500),
    } as any);
  }

  async query(filter: AuditQuery, page: number = 1, limit: number = 50) {
    return this.repo.find(filter, page, limit);
  }

  private redactSensitive(before?: Record<string, any>, after?: Record<string, any>) {
    const SENSITIVE_KEYS = ['nationalIdNumber', 'passportNumber', 'incomeAmount', 'signatureHash', 'signatureNonce'];
    const redact = (obj?: Record<string, any>) => {
      if (!obj) return obj;
      const clone = { ...obj };
      for (const key of SENSITIVE_KEYS) {
        if (clone[key] !== undefined) clone[key] = '[REDACTED]';
      }
      return clone;
    };
    return { before: redact(before), after: redact(after) };
  }
}
