import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  uploadDocument,
  listDocuments,
  getSignedUrl,
  verifyDocument,
  rejectDocument,
  deleteDocument,
} from '../controllers/tenantDocumentControllerV2.js';

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || 'anonymous',
  validate: { xForwardedForHeader: false, ip: false },
  message: { success: false, message: 'Upload rate limit exceeded (20/hour). Try again later.' },
});

router.post('/tenants/:id/documents', authenticate, uploadLimiter, memoryUpload.single('document'), uploadDocument);

router.get('/tenants/:id/documents', authenticate, listDocuments);

router.get('/documents/:docId/signed-url', authenticate, getSignedUrl);

router.post('/documents/:docId/verify', authenticate, authorize('owner', 'admin'), verifyDocument);

router.post('/documents/:docId/reject', authenticate, authorize('owner', 'admin'), rejectDocument);

router.delete('/documents/:docId', authenticate, deleteDocument);

export default router;
