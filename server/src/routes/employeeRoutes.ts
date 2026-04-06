import { Router } from 'express';
import { body } from 'express-validator';
import * as employeeController from '../controllers/employeeController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as leaveController from '../controllers/leaveController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate as any);

router.post('/',
  validate([
    body('userId').notEmpty().withMessage('User ID is required'),
    body('employment.position').notEmpty().withMessage('Position is required'),
    body('employment.department').isIn(['security', 'maintenance', 'cleaning', 'management', 'marketing']).withMessage('Invalid department'),
    body('employment.startDate').isISO8601().withMessage('Valid start date required'),
    body('salary.baseSalary').isNumeric().withMessage('Base salary must be a number'),
  ]),
  employeeController.createEmployee as any
);

router.get('/', employeeController.getEmployees as any);
router.get('/:id', employeeController.getEmployee as any);
router.put('/:id', employeeController.updateEmployee as any);
router.patch('/:id/status',
  validate([
    body('status').isIn(['active', 'on_leave', 'suspended', 'terminated']).withMessage('Invalid status'),
  ]),
  employeeController.updateEmployeeStatus as any
);
router.post('/:id/documents',
  validate([
    body('type').notEmpty().withMessage('Document type required'),
    body('url').notEmpty().withMessage('Document URL required'),
  ]),
  employeeController.addEmployeeDocument as any
);

router.get('/:id/attendance', attendanceController.getEmployeeAttendance as any);
router.get('/:id/leave-balance', leaveController.getLeaveBalance as any);

export default router;
