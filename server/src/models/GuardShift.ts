import mongoose, { Schema } from 'mongoose';
import { IGuardShift } from '../types/index.js';

const guardShiftSchema = new Schema<IGuardShift>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    guardId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shiftType: {
      type: String,
      enum: ['morning', 'afternoon', 'night'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    daysOfWeek: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.every((d) => d >= 0 && d <= 6),
        message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    guardPost: {
      type: String,
      enum: ['main_gate', 'back_gate', 'parking', 'lobby', 'patrol', 'rooftop', 'basement'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

guardShiftSchema.index({ propertyId: 1, guardId: 1, shiftType: 1 }, { unique: true });
guardShiftSchema.index({ propertyId: 1, isActive: 1 });

const GuardShift = mongoose.model<IGuardShift>('GuardShift', guardShiftSchema);

export default GuardShift;
