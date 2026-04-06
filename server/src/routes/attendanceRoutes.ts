import { Router } from 'express';
import { body } from 'express-validator';
import * as attendanceController from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPropertyAccess } from '../middleware/propertyAccess.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(authenticate as any);

router.post('/check-in',
  checkPropertyAccess as any,
  validate([
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
  ]),
  attendanceController.checkIn as any
);

router.patch('/check-out',
  checkPropertyAccess as any,
  validate([
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
  ]),
  attendanceController.checkOut as any
);

router.get('/', checkPropertyAccess as any, attendanceController.getDailyAttendance as any);
router.get('/report', checkPropertyAccess as any, attendanceController.getMonthlyReport as any);

export default router;
