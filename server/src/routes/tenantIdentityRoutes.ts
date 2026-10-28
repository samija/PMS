import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getIdentity, updateIdentity, setVerificationStatus } from '../controllers/tenantIdentityController.js';

const router = Router();

router.get('/:id/identity', authenticate, getIdentity);

router.put('/:id/identity', authenticate, updateIdentity);

router.post('/:id/identity/verify', authenticate, authorize('owner', 'admin'), setVerificationStatus);

export default router;
