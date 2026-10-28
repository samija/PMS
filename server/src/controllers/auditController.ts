import { Request, Response, NextFunction } from 'express';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { TenantAuditService } from '../application/services/TenantAuditService.js';

const svc = () => container.get<TenantAuditService>(TYPES.TenantAuditService);

export const queryAuditLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, entityType, action, from, to, page, limit } = req.query;
    const result = await svc().query(
      {
        tenantId: tenantId as string,
        entityType: entityType as string,
        action: action as string,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
      },
      Number(page) || 1,
      Number(limit) || 50
    );
    res.json({
      success: true,
      data: result.data,
      pagination: { total: result.total, page: Number(page) || 1, limit: Number(limit) || 50 },
    });
  } catch (err) {
    next(err);
  }
};
