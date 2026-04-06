import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import ListingPromotion from '../models/ListingPromotion.js';
import Property from '../models/Property.js';
import { BadRequestError, NotFoundError } from '../domain/exceptions/AppError.js';

const router = Router();

// GET /api/promotions - Get all promotions for the owner
router.get('/', authenticate, authorize('owner', 'admin'), async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const promotions = await ListingPromotion.find({ ownerId })
      .populate('propertyId', 'name address type')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: promotions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/promotions - Create a promotion
router.post('/', authenticate, authorize('owner'), async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const { propertyId, type, durationDays } = req.body;

    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) throw new NotFoundError('Property not found');

    // Check for existing active promotion
    const existing = await ListingPromotion.findOne({
      propertyId,
      isActive: true,
      endDate: { $gt: new Date() },
    });
    if (existing) {
      throw new BadRequestError('This property already has an active promotion');
    }

    const pricing: Record<string, number> = {
      featured: 500,
      boosted: 300,
      premium: 1000,
    };

    const days = durationDays || 30;
    const amount = (pricing[type] || 500) * (days / 30);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const promotion = await ListingPromotion.create({
      propertyId,
      ownerId,
      type,
      startDate,
      endDate,
      amount,
      isActive: true,
    });

    res.status(201).json({ success: true, data: promotion });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// DELETE /api/promotions/:id - Cancel a promotion
router.delete('/:id', authenticate, authorize('owner'), async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const promotion = await ListingPromotion.findOne({ _id: req.params.id, ownerId });
    if (!promotion) throw new NotFoundError('Promotion not found');

    promotion.isActive = false;
    await promotion.save();

    res.json({ success: true, message: 'Promotion cancelled' });
  } catch (error: any) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// GET /api/promotions/featured - Public: Get featured listings
router.get('/featured', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const promotions = await ListingPromotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gt: now },
    })
      .populate('propertyId')
      .sort({ type: -1, createdAt: -1 })
      .limit(20);

    // Track impressions
    const ids = promotions.map((p) => p._id);
    await ListingPromotion.updateMany({ _id: { $in: ids } }, { $inc: { impressions: 1 } });

    res.json({ success: true, data: promotions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/promotions/:id/click - Track click
router.post('/:id/click', async (req: Request, res: Response) => {
  try {
    await ListingPromotion.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
