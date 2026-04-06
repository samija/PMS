import mongoose, { Schema } from 'mongoose';
import { IPerformanceReview } from '../types/index.js';

const performanceReviewSchema = new Schema<IPerformanceReview>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    ratings: {
      punctuality: { type: Number, min: 1, max: 5, required: true },
      workQuality: { type: Number, min: 1, max: 5, required: true },
      teamwork: { type: Number, min: 1, max: 5, required: true },
      communication: { type: Number, min: 1, max: 5, required: true },
      reliability: { type: Number, min: 1, max: 5, required: true },
      overall: { type: Number, min: 1, max: 5 },
    },
    strengths: {
      type: String,
      required: true,
    },
    improvements: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      required: true,
    },
    employeeComments: String,
    status: {
      type: String,
      enum: ['draft', 'submitted', 'acknowledged'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate overall rating before save
performanceReviewSchema.pre('save', function (next) {
  if (this.ratings) {
    const { punctuality, workQuality, teamwork, communication, reliability } = this.ratings;
    this.ratings.overall = Math.round(((punctuality + workQuality + teamwork + communication + reliability) / 5) * 10) / 10;
  }
  next();
});

const PerformanceReview = mongoose.model<IPerformanceReview>('PerformanceReview', performanceReviewSchema);

export default PerformanceReview;
