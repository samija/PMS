import { Router } from 'express';
import { body } from 'express-validator';
import * as incidentController from '../controllers/incidentController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPropertyAccess } from '../middleware/propertyAccess.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(authenticate as any);

router.post('/',
  checkPropertyAccess as any,
  validate([
    body('incidentType').isIn(['theft', 'vandalism', 'unauthorized_access', 'disturbance', 'fire', 'flood', 'medical', 'suspicious_activity', 'other']).withMessage('Invalid incident type'),
    body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('occurredAt').isISO8601().withMessage('Valid date required'),
  ]),
  incidentController.reportIncident as any
);

router.get('/', checkPropertyAccess as any, incidentController.getIncidents as any);
router.get('/:id', checkPropertyAccess as any, incidentController.getIncident as any);
router.put('/:id', checkPropertyAccess as any, incidentController.updateIncident as any);
router.patch('/:id/status',
  checkPropertyAccess as any,
  validate([
    body('status').isIn(['reported', 'investigating', 'resolved', 'closed']).withMessage('Invalid status'),
  ]),
  incidentController.updateIncidentStatus as any
);

export default router;
