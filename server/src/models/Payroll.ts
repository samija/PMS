import mongoose, { Schema } from 'mongoose';
import { IPayroll } from '../types/index.js';

const payrollSchema = new Schema<IPayroll>(
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
    period: {
      month: {
        type: Number,
        min: 1,
        max: 12,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    baseSalary: {
      type: Number,
      required: true,
    },
    overtime: {
      hours: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    deductions: [
      {
        type: {
          type: String,
          enum: ['tax', 'pension', 'absence', 'other'],
        },
        description: String,
        amount: Number,
      },
    ],
    bonuses: [
      {
        description: String,
        amount: Number,
      },
    ],
    grossPay: {
      type: Number,
      required: true,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    netPay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'paid'],
      default: 'draft',
    },
    paidAt: Date,
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'chapa'],
      default: 'bank_transfer',
    },
    transactionRef: String,
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ employeeId: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });
payrollSchema.index({ propertyId: 1, status: 1 });

const Payroll = mongoose.model<IPayroll>('Payroll', payrollSchema);

export default Payroll;
