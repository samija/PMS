import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../application/services/SubscriptionService.js';
import { ForbiddenError } from '../domain/exceptions/AppError.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';

const subscriptionService = container.get<SubscriptionService>(TYPES.SubscriptionService);

export const checkPropertyLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = (req as any).user?.id;
    if (!ownerId) return next();

    const canAdd = await subscriptionService.canAddProperty(ownerId);
    if (!canAdd) {
      throw new ForbiddenError('You have reached the maximum number of properties for your subscription plan. Please upgrade to add more.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const checkUnitLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const propertyId = req.params.propertyId || req.params.id;
    if (!propertyId) return next();

    const canAdd = await subscriptionService.canAddUnit(propertyId);
    if (!canAdd) {
      throw new ForbiddenError('You have reached the maximum number of units for your subscription plan. Please upgrade to add more.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const checkStaffLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = (req as any).user?.id;
    if (!ownerId) return next();

    const canAdd = await subscriptionService.canAddStaff(ownerId);
    if (!canAdd) {
      throw new ForbiddenError('You have reached the maximum staff limit for your subscription plan. Please upgrade to add more.');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireFeature = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = (req as any).user?.id;
      if (!ownerId) return next();

      const hasAccess = await subscriptionService.hasFeature(ownerId, feature);
      if (!hasAccess) {
        throw new ForbiddenError(`Your subscription plan does not include the "${feature}" feature. Please upgrade your plan.`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
