import { injectable } from 'inversify';
import { ISubscriptionService, SubscriptionLimits } from '../../domain/interfaces/ISubscriptionService.js';
import Property from '../../models/Property.js';
import User from '../../models/User.js';
import { ForbiddenError } from '../../domain/exceptions/AppError.js';

const PLAN_LIMITS: Record<string, SubscriptionLimits> = {
  free: {
    maxProperties: 1,
    maxUnitsPerProperty: 5,
    maxStaff: 0,
    features: ['basic_payments', 'basic_maintenance'],
  },
  starter: {
    maxProperties: 3,
    maxUnitsPerProperty: 20,
    maxStaff: 2,
    features: ['basic_payments', 'basic_maintenance', 'email_notifications', 'payment_schedules'],
  },
  professional: {
    maxProperties: 10,
    maxUnitsPerProperty: 50,
    maxStaff: 10,
    features: [
      'basic_payments', 'basic_maintenance', 'email_notifications',
      'payment_schedules', 'reports', 'waiting_list', 'listings',
      'bulk_operations', 'advanced_analytics',
    ],
  },
  enterprise: {
    maxProperties: Infinity,
    maxUnitsPerProperty: Infinity,
    maxStaff: Infinity,
    features: [
      'basic_payments', 'basic_maintenance', 'email_notifications',
      'payment_schedules', 'reports', 'waiting_list', 'listings',
      'bulk_operations', 'advanced_analytics', 'api_access',
      'custom_branding', 'priority_support',
    ],
  },
};

@injectable()
export class SubscriptionService implements ISubscriptionService {
  getPlanLimits(plan: string): SubscriptionLimits {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  }

  async canAddProperty(ownerId: string): Promise<boolean> {
    const user = await User.findById(ownerId).lean();
    if (!user) return false;

    const plan = (user as any).subscriptionPlan || 'free';
    const limits = this.getPlanLimits(plan);
    const propertyCount = await Property.countDocuments({ ownerId });

    return propertyCount < limits.maxProperties;
  }

  async canAddUnit(propertyId: string): Promise<boolean> {
    const property = await Property.findById(propertyId).lean();
    if (!property) return false;

    const owner = await User.findById((property as any).ownerId).lean();
    if (!owner) return false;

    const plan = (owner as any).subscriptionPlan || 'free';
    const limits = this.getPlanLimits(plan);
    const Unit = (await import('../../models/Unit.js')).default;
    const unitCount = await Unit.countDocuments({ property: propertyId });

    return unitCount < limits.maxUnitsPerProperty;
  }

  async canAddStaff(ownerId: string): Promise<boolean> {
    const user = await User.findById(ownerId).lean();
    if (!user) return false;

    const plan = (user as any).subscriptionPlan || 'free';
    const limits = this.getPlanLimits(plan);
    const PropertyStaff = (await import('../../models/PropertyStaff.js')).default;
    const staffCount = await PropertyStaff.countDocuments({ ownerId });

    return staffCount < limits.maxStaff;
  }

  async hasFeature(ownerId: string, feature: string): Promise<boolean> {
    const user = await User.findById(ownerId).lean();
    if (!user) return false;

    const plan = (user as any).subscriptionPlan || 'free';
    const limits = this.getPlanLimits(plan);
    return limits.features.includes(feature);
  }
}

export default SubscriptionService;
