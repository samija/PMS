import { Router } from 'express';
import { body } from 'express-validator';
import * as guardController from '../controllers/guardController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPropertyAccess } from '../middleware/propertyAccess.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(authenticate as any);

router.post('/shifts',
  checkPropertyAccess as any,
  validate([
    body('guardId').notEmpty().withMessage('Guard ID is required'),
    body('shiftType').isIn(['morning', 'afternoon', 'night']).withMessage('Invalid shift type'),
    body('startTime').notEmpty().withMessage('Start time required'),
    body('endTime').notEmpty().withMessage('End time required'),
    body('daysOfWeek').isArray({ min: 1 }).withMessage('At least one day of week is required'),
    body('guardPost').isIn(['main_gate', 'back_gate', 'parking', 'lobby', 'patrol', 'rooftop', 'basement']).withMessage('Invalid guard post'),
    body('effectiveFrom').isISO8601().withMessage('Valid effective date required'),
  ]),
  guardController.createShift as any
);

router.get('/shifts', checkPropertyAccess as any, guardController.getShifts as any);
router.put('/shifts/:shiftId', checkPropertyAccess as any, guardController.updateShift as any);
router.delete('/shifts/:shiftId', checkPropertyAccess as any, guardController.deleteShift as any);
router.get('/schedule', checkPropertyAccess as any, guardController.getWeeklySchedule as any);
router.get('/posts', checkPropertyAccess as any, guardController.getGuardPosts as any);

export default router;
