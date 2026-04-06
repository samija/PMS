import { Router } from 'express';
import { body } from 'express-validator';
import * as performanceController from '../controllers/performanceController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPropertyAccess } from '../middleware/propertyAccess.js';
import { validate } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
router.use(authenticate as any);

router.post('/',
  checkPropertyAccess as any,
  validate([
    body('employeeId').notEmpty().withMessage('Employee ID required'),
    body('reviewPeriod.startDate').isISO8601().withMessage('Valid start date required'),
    body('reviewPeriod.endDate').isISO8601().withMessage('Valid end date required'),
    body('ratings.punctuality').isFloat({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('ratings.workQuality').isFloat({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('ratings.teamwork').isFloat({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('ratings.communication').isFloat({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('ratings.reliability').isFloat({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('strengths').notEmpty().withMessage('Strengths required'),
    body('improvements').notEmpty().withMessage('Improvements required'),
    body('comments').notEmpty().withMessage('Comments required'),
  ]),
  performanceController.createReview as any
);

router.get('/', checkPropertyAccess as any, performanceController.getReviews as any);
router.get('/:id', checkPropertyAccess as any, performanceController.getReview as any);
router.put('/:id', checkPropertyAccess as any, performanceController.updateReview as any);
router.patch('/:id/submit', checkPropertyAccess as any, performanceController.submitReview as any);

export default router;
