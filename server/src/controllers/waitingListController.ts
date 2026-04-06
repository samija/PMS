import { Response, NextFunction } from 'express';
import WaitingList from '../models/WaitingList.js';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import { AuthRequest } from '../types/index.js';
import { WaitingListService } from '../application/services/WaitingListService.js';

// Create service instance
const waitingListService = new WaitingListService(WaitingList, Property, Unit);

export const applyToWaitingList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicantId = req.user?._id.toString();

    if (!applicantId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const entry = await waitingListService.applyToWaitingList({
      ...req.body,
      applicantId,
    });

    res.status(201).json({
      success: true,
      message: 'Successfully added to waiting list',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const getWaitingList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await waitingListService.getWaitingList(ownerId, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const offerUnit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const entry = await waitingListService.offerUnit({
      entryId: id,
      ownerId,
      ...req.body,
    });

    res.json({
      success: true,
      message: 'Offer sent successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const respondToOffer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const applicantId = req.user?._id.toString();

    if (!applicantId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const entry = await waitingListService.respondToOffer({
      entryId: id,
      applicantId,
      ...req.body,
    });

    res.json({
      success: true,
      message: req.body.accept ? 'Offer accepted' : 'Offer declined',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWaitingListStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const ownerId = req.user?._id.toString();

    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const entry = await waitingListService.updateWaitingListStatus({
      entryId: id,
      ownerId,
      ...req.body,
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applicantId = req.user?._id.toString();

    if (!applicantId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const applications = await waitingListService.getMyApplications(applicantId);

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  applyToWaitingList,
  getWaitingList,
  offerUnit,
  respondToOffer,
  updateWaitingListStatus,
  getMyApplications,
};
