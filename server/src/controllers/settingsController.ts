import { Request, Response, NextFunction } from 'express';
import { OwnerSettingsService } from '../application/services/OwnerSettingsService.js';
import OwnerPaymentSettings from '../models/OwnerPaymentSettings.js';
import { ETHIOPIAN_BANKS } from '../models/OwnerPaymentSettings.js';

// Create service instance
const ownerSettingsService = new OwnerSettingsService(OwnerPaymentSettings);

/**
 * Get owner's payment settings
 */
export const getPaymentSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const settings = await ownerSettingsService.getPaymentSettings(ownerId);

    res.json({
      success: true,
      data: {
        settings,
        supportedBanks: ETHIOPIAN_BANKS,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update owner's payment settings
 */
export const updatePaymentSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const settings = await ownerSettingsService.updatePaymentSettings(ownerId, req.body);

    res.json({
      success: true,
      message: 'Payment settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get owner's payment info for tenants
 */
export const getOwnerPaymentInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      res.status(400).json({ success: false, message: 'Owner ID is required' });
      return;
    }

    const paymentInfo = await ownerSettingsService.getSettingsForTenant(ownerId);

    if (!paymentInfo) {
      res.json({
        success: true,
        data: null,
        message: 'Owner has not configured payment settings',
      });
      return;
    }

    res.json({
      success: true,
      data: paymentInfo,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of supported Ethiopian banks
 */
export const getSupportedBanks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.json({
      success: true,
      data: ETHIOPIAN_BANKS,
    });
  } catch (error) {
    next(error);
  }
};
