import { Request, Response, NextFunction } from 'express';
import { TenantDocumentService } from '../application/services/TenantDocumentService.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';

const docService = () => container.get<TenantDocumentService>(TYPES.TenantDocumentService);

export const uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const doc = await docService().upload(
      req.params.id,
      req.file.buffer,
      req.file.mimetype,
      req.body,
      req.user!._id.toString(),
      req.user!.role
    );
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const listDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
    const docs = await docService().listDocuments(
      req.params.id,
      Object.keys(filter).length ? filter : undefined,
      req.user!._id.toString(),
      req.user!.role
    );
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

export const getSignedUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const url = await docService().getSignedUrl(req.params.docId, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
};

export const verifyDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await docService().verify(req.params.docId, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const rejectDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reasonCode, reasonText } = req.body;
    const doc = await docService().reject(
      req.params.docId,
      reasonCode,
      reasonText,
      req.user!._id.toString(),
      req.user!.role
    );
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await docService().softDeleteDocument(req.params.docId, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
