import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/leaseTemplateController.js';

const router = Router();

router.get('/', authenticate, authorize('owner', 'admin'), listTemplates);
router.get('/:id', authenticate, authorize('owner', 'admin'), getTemplate);
router.post('/', authenticate, authorize('owner', 'admin'), createTemplate);
router.put('/:id', authenticate, authorize('owner', 'admin'), updateTemplate);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteTemplate);

export default router;
