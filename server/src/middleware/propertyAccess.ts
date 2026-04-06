import { Request, Response, NextFunction } from 'express';
import Property from '../models/Property.js';
import PropertyStaff from '../models/PropertyStaff.js';
import logger from '../config/logger.js';

/**
 * Check if user has access to a property
 * - Admin: access to all properties
 * - Owner: access to their own properties
 * - Manager: access to properties they manage
 * - Staff: access to assigned properties
 */
export const checkPropertyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const propertyId = req.params.id || req.params.propertyId;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Admin has access to all properties
    if (userRole === 'admin') {
      req.accessLevel = 'admin';
      next();
      return;
    }

    // Check if user is the property owner
    const property = await Property.findOne({ _id: propertyId, ownerId: userId });
    if (property) {
      req.property = property;
      req.accessLevel = 'owner';
      next();
      return;
    }

    // Check if user is assigned staff
    const staffAssignment = await PropertyStaff.findOne({
      propertyId,
      userId,
      isActive: true,
    }).populate('propertyId');

    if (staffAssignment) {
      req.property = staffAssignment.propertyId as any;
      req.staffAssignment = staffAssignment;
      req.accessLevel = staffAssignment.role;
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'You do not have access to this property',
    });
  } catch (error) {
    logger.error('Property access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify property access',
    });
  }
};

/**
 * Check if user can manage staff for a property
 * Only admin, owner, and managers can manage staff
 */
export const canManageStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userRole = req.user?.role;
  const accessLevel = req.accessLevel;

  if (userRole === 'admin' || accessLevel === 'owner' || accessLevel === 'manager') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: 'You do not have permission to manage staff',
  });
};

/**
 * Check specific permissions for staff
 */
export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;
    const accessLevel = req.accessLevel;

    // Admin and owner have all permissions
    if (userRole === 'admin' || accessLevel === 'owner') {
      next();
      return;
    }

    // Check staff permissions
    if (req.staffAssignment?.permissions.includes(requiredPermission as any)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'You do not have the required permission for this action',
    });
  };
};
