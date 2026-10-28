import Bull from 'bull';
import { ReportJobData } from '../index.js';
import Payment from '../../../models/Payment.js';
import Unit from '../../../models/Unit.js';
import { logger } from '../../../config/logger.js';

export const processReportJob = async (job: Bull.Job<ReportJobData>): Promise<void> => {
  const { type, ownerId, propertyId, month, year } = job.data;

  try {
    switch (type) {
      case 'monthly_payment_report': {
        const now = new Date();
        const reportMonth = month || now.getMonth() + 1;
        const reportYear = year || now.getFullYear();

        const startDate = new Date(reportYear, reportMonth - 1, 1);
        const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);

        const query: any = { createdAt: { $gte: startDate, $lte: endDate } };
        if (propertyId) query.property = propertyId;

        const payments = await Payment.find(query);
        const totalCollected = payments
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const totalPending = payments
          .filter((p: any) => p.status === 'pending')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        logger.info(`[ReportProcessor] Monthly payment report for ${reportMonth}/${reportYear}: collected=${totalCollected} ETB, pending=${totalPending} ETB`);
        break;
      }
      case 'occupancy_report': {
        const query: any = {};
        if (propertyId) query.property = propertyId;

        const units = await Unit.find(query);
        const total = units.length;
        const occupied = units.filter((u: any) => u.status === 'occupied').length;
        const rate = total > 0 ? ((occupied / total) * 100).toFixed(1) : '0';

        logger.info(`[ReportProcessor] Occupancy report: ${occupied}/${total} units occupied (${rate}%)`);
        break;
      }
      default:
        logger.warn(`[ReportProcessor] Unknown job type: ${type}`);
    }
  } catch (error) {
    logger.error(`[ReportProcessor] Failed to process ${type}:`, error);
    throw error;
  }
};

export default processReportJob;
