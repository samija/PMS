import mongoose, { Schema } from 'mongoose';
import { IPaymentSchedule } from '../types/index.js';

const paymentScheduleSchema = new Schema<IPaymentSchedule>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['rent', 'utility', 'maintenance', 'custom'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    recurrence: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'one_time'],
      default: 'monthly',
    },
    dayOfMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 28,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    autoGenerate: {
      type: Boolean,
      default: true,
    },
    generateAheadMonths: {
      type: Number,
      default: 3,
      min: 1,
      max: 12,
    },
    lastGeneratedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active schedules that need generation
paymentScheduleSchema.index({ isActive: 1, autoGenerate: 1, lastGeneratedDate: 1 });

// Index for finding schedules by tenant
paymentScheduleSchema.index({ tenantId: 1, isActive: 1 });

// Index for finding schedules by owner
paymentScheduleSchema.index({ ownerId: 1, isActive: 1 });

const PaymentSchedule = mongoose.model<IPaymentSchedule>('PaymentSchedule', paymentScheduleSchema);

export default PaymentSchedule;
