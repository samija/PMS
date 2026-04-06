import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPerformanceReview } from '../../types/index.js';
import {
  IPerformanceService,
  CreatePerformanceReviewData,
  UpdatePerformanceReviewData,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class PerformanceService implements IPerformanceService {
  private performanceReviewModel: Model<IPerformanceReview>;

  constructor(@inject(TYPES.PerformanceReviewModel) performanceReviewModel: Model<IPerformanceReview>) {
    this.performanceReviewModel = performanceReviewModel;
  }

  async createReview(data: CreatePerformanceReviewData): Promise<IPerformanceReview> {
    const review = await this.performanceReviewModel.create({
      ...data,
      status: 'draft',
    });
    return review.populate([
      { path: 'employeeId', select: 'name email phone role avatar' },
      { path: 'reviewerId', select: 'name email' },
      { path: 'propertyId', select: 'name' },
    ]);
  }

  async getReviews(propertyId: string, options: { employeeId?: string; page?: number; limit?: number } = {}): Promise<any> {
    const { page = 1, limit = 10 } = options;
    const query: any = { propertyId };
    if (options.employeeId) query.employeeId = options.employeeId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.performanceReviewModel.find(query)
        .populate('employeeId', 'name email phone role avatar')
        .populate('reviewerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.performanceReviewModel.countDocuments(query),
    ]);

    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getReview(propertyId: string, id: string): Promise<IPerformanceReview> {
    const review = await this.performanceReviewModel.findOne({ _id: id, propertyId })
      .populate('employeeId', 'name email phone role avatar')
      .populate('reviewerId', 'name email')
      .populate('propertyId', 'name');
    if (!review) throw new NotFoundError('Performance review', id);
    return review;
  }

  async updateReview(propertyId: string, id: string, data: UpdatePerformanceReviewData): Promise<IPerformanceReview> {
    const updates: any = {};
    if (data.ratings) {
      Object.entries(data.ratings).forEach(([key, value]) => {
        if (value !== undefined) updates[`ratings.${key}`] = value;
      });
    }
    if (data.strengths) updates.strengths = data.strengths;
    if (data.improvements) updates.improvements = data.improvements;
    if (data.comments) updates.comments = data.comments;
    if (data.employeeComments) updates.employeeComments = data.employeeComments;

    const review = await this.performanceReviewModel.findOneAndUpdate(
      { _id: id, propertyId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('employeeId', 'name email phone role avatar')
      .populate('reviewerId', 'name email');
    if (!review) throw new NotFoundError('Performance review', id);
    return review;
  }

  async submitReview(propertyId: string, id: string): Promise<IPerformanceReview> {
    const review = await this.performanceReviewModel.findOneAndUpdate(
      { _id: id, propertyId, status: 'draft' },
      { status: 'submitted' },
      { new: true }
    )
      .populate('employeeId', 'name email phone role avatar')
      .populate('reviewerId', 'name email');
    if (!review) throw new NotFoundError('Performance review', id);
    return review;
  }
}
