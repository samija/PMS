import { Request, Response, NextFunction } from 'express';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { LeaseTemplateService } from '../application/services/LeaseTemplateService.js';

const svc = () => container.get<LeaseTemplateService>(TYPES.LeaseTemplateService);

export const listTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await svc().findAvailable(req.user!._id.toString());
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
};

export const getTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await svc().findById(req.params.id);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await svc().create({ ...req.body, ownerId: req.user!._id.toString() });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

export const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await svc().update(req.params.id, req.user!._id.toString(), req.body);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await svc().remove(req.params.id, req.user!._id.toString());
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};
