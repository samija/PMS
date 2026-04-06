import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { allQueues } from '../infrastructure/queues/index.js';

const router = Router();

// GET /api/admin/queues/stats - Queue statistics (admin only)
router.get('/queues/stats', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const stats = await Promise.all(
      allQueues.map(async (queue) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);
        return {
          name: queue.name,
          waiting,
          active,
          completed,
          failed,
          delayed,
        };
      })
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch queue stats' });
  }
});

export default router;
