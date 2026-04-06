export interface SubscriptionLimits {
  maxProperties: number;
  maxUnitsPerProperty: number;
  maxStaff: number;
  features: string[];
}

export interface ISubscriptionService {
  getPlanLimits(plan: string): SubscriptionLimits;
  canAddProperty(ownerId: string): Promise<boolean>;
  canAddUnit(propertyId: string): Promise<boolean>;
  canAddStaff(ownerId: string): Promise<boolean>;
  hasFeature(ownerId: string, feature: string): Promise<boolean>;
}
