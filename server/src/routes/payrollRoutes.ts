import { Router } from 'express';
import { body } from 'express-validator';
import * as payrollController from '../controllers/payrollController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPropertyAccess } from '../middleware/propertyAccess.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(authenticate as any);

router.post('/generate',
  checkPropertyAccess as any,
  validate([
    body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month required'),
    body('year').isInt({ min: 2020 }).withMessage('Valid year required'),
  ]),
  payrollController.generatePayroll as any
);

router.get('/', checkPropertyAccess as any, payrollController.getPayrollRecords as any);
router.get('/:id', checkPropertyAccess as any, payrollController.getPayrollDetail as any);
router.patch('/:id/approve', checkPropertyAccess as any, payrollController.approvePayroll as any);
router.patch('/:id/pay',
  checkPropertyAccess as any,
  validate([
    body('paymentMethod').isIn(['bank_transfer', 'cash', 'chapa']).withMessage('Invalid payment method'),
  ]),
  payrollController.markPayrollAsPaid as any
);

export default router;
