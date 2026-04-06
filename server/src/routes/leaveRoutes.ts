import { Router } from 'express';
import { body } from 'express-validator';
import * as leaveController from '../controllers/leaveController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate as any);

router.post('/requests',
  validate([
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('propertyId').notEmpty().withMessage('Property ID is required'),
    body('leaveType').isIn(['annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'unpaid']).withMessage('Invalid leave type'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ]),
  leaveController.submitLeaveRequest as any
);

router.get('/requests', leaveController.getLeaveRequests as any);
router.patch('/requests/:id/approve', leaveController.approveLeaveRequest as any);
router.patch('/requests/:id/reject',
  validate([body('reason').notEmpty().withMessage('Rejection reason required')]),
  leaveController.rejectLeaveRequest as any
);
router.patch('/requests/:id/cancel', leaveController.cancelLeaveRequest as any);

export default router;
