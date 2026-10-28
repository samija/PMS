import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createDraft,
  listLeases,
  getLease,
  updateDraft,
  submitForSignature,
  signLease,
  terminateLease,
  renewLease,
  amendLease,
} from '../controllers/leaseController.js';

const router = Router();

router.post('/', authenticate, authorize('owner', 'admin'), createDraft);
router.get('/', authenticate, listLeases);
router.get('/:id', authenticate, getLease);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateDraft);
router.post('/:id/submit-for-signature', authenticate, authorize('owner', 'admin'), submitForSignature);
router.post('/:id/sign', authenticate, signLease);
router.post('/:id/terminate', authenticate, authorize('owner', 'admin'), terminateLease);
router.post('/:id/renew', authenticate, authorize('owner', 'admin'), renewLease);
router.post('/:id/amend', authenticate, authorize('owner', 'admin'), amendLease);

export default router;
