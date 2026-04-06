import { Response, NextFunction } from 'express';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Unit from '../models/Unit.js';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
import PaymentSchedule from '../models/PaymentSchedule.js';
import { AuthRequest } from '../types/index.js';
import { TenantService } from '../application/services/TenantService.js';
import { PaymentScheduleService } from '../application/services/PaymentScheduleService.js';

// Create service instances
const tenantService = new TenantService(User, Tenant, Unit, Property);
const scheduleService = new PaymentScheduleService(PaymentSchedule, Payment, Tenant);

export const createTenant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tenant = await tenantService.createTenant({
      ...req.body,
      ownerId,
    });

    // Auto-create default rent schedule for the tenant
    try {
      await scheduleService.createDefaultScheduleForTenant(
        tenant._id.toString(),
        ownerId,
        tenant.propertyId.toString(),
        tenant.unitId.toString(),
        tenant.leaseAgreement.monthlyRent,
        tenant.leaseAgreement.startDate
      );
    } catch (scheduleError) {
      // Log error but don't fail tenant creation
      console.error('Failed to create default payment schedule:', scheduleError);
    }

    res.status(201).json({
      success: true,
      message: 'Tenant added successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export const getTenants = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await tenantService.getTenants(ownerId, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTenant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tenant = await tenantService.getTenant(id, ownerId);

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tenant = await tenantService.updateTenant(id, ownerId, req.body);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export const terminateTenant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tenant = await tenantService.terminateTenant(id, ownerId);

    res.json({
      success: true,
      message: 'Tenant terminated successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

// Tenant portal endpoints
export const getMyTenancy = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tenant = await tenantService.getMyTenancy(userId);

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

// Document management endpoints
export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, name } = req.body;
    const ownerId = req.user?._id.toString();
    const file = req.file as Express.Multer.File;

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    if (!type || !name) {
      res.status(400).json({ success: false, message: 'Document type and name are required' });
      return;
    }

    const tenant = await tenantService.addDocument(id, ownerId, {
      url: (file as any).path || (file as any).secure_url,
      type,
      name,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const documents = await tenantService.getDocuments(id, ownerId);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, docId } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tenant = await tenantService.deleteDocument(id, docId, ownerId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createTenant,
  getTenants,
  getTenant,
  updateTenant,
  terminateTenant,
  getMyTenancy,
  uploadDocument,
  getDocuments,
  deleteDocument,
};
