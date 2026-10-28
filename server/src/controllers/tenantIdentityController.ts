import { Request, Response, NextFunction } from 'express';
import { TenantIdentityService } from '../application/services/TenantIdentityService.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';

const identityService = () => container.get<TenantIdentityService>(TYPES.TenantIdentityService);

export const getIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await identityService().getIdentity(req.params.id, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await identityService().updateIdentity(
      req.params.id,
      req.body,
      req.user!._id.toString(),
      req.user!.role
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const setVerificationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, reasonCode, reasonText } = req.body;
    const result = await identityService().setVerificationStatus(
      req.params.id,
      status,
      req.user!._id.toString(),
      req.user!.role,
      reasonCode,
      reasonText
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
