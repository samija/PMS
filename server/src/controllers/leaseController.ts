import { Request, Response, NextFunction } from 'express';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { LeaseAgreementService } from '../application/services/LeaseAgreementService.js';

const svc = () => container.get<LeaseAgreementService>(TYPES.LeaseAgreementService);

export const createDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lease = await svc().createDraft({ ...req.body, ownerId: req.user!._id.toString() });
    res.status(201).json({ success: true, data: lease });
  } catch (err) {
    next(err);
  }
};

export const listLeases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leases = await svc().listByOwner(req.user!._id.toString());
    res.json({ success: true, data: leases });
  } catch (err) {
    next(err);
  }
};

export const getLease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lease = await svc().getById(req.params.id);
    res.json({ success: true, data: lease });
  } catch (err) {
    next(err);
  }
};

export const updateDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lease = await svc().updateDraft(req.params.id, req.user!._id.toString(), req.body);
    res.json({ success: true, data: lease });
  } catch (err) {
    next(err);
  }
};

export const submitForSignature = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lease = await svc().submitForSignature(req.params.id, req.user!._id.toString());
    res.json({ success: true, data: lease });
  } catch (err) {
    next(err);
  }
};

export const signLease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { side } = req.body;
    const ip = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown')
      .split(',')[0]
      .trim();
    const ua = req.headers['user-agent'] || 'unknown';
    const lease = await svc().sign(req.params.id, side, req.user!._id.toString(), ip, ua);
    res.json({ success: true, data: lease });
  } catch (err) {
    next(err);
  }
};

export const terminateLease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reasonCode, reasonText } = req.body;
    const lease = await svc().terminate(req.params.id, req.user!._id.toString(), reasonCode, reasonText);
    res.json({ success: true, data: lease });
  } catch (err) {
    next(err);
  }
};

export const renewLease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const draft = await svc().renew(req.params.id, req.user!._id.toString());
    res.status(201).json({ success: true, data: draft });
  } catch (err) {
    next(err);
  }
};

export const amendLease = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const draft = await svc().amend(req.params.id, req.user!._id.toString(), req.body);
    res.status(201).json({ success: true, data: draft });
  } catch (err) {
    next(err);
  }
};
