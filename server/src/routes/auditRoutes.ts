import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { queryAuditLog } from '../controllers/auditController.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), queryAuditLog);

export default router;
