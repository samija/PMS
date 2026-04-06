import mongoose, { Schema } from 'mongoose';
import { IMaintenance } from '../types/index.js';

const timelineEntrySchema = new Schema(
  {
    status: {
      type: String,
      enum: ['submitted', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const maintenanceSchema = new Schema<IMaintenance>(
  {
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
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'appliance', 'structural', 'hvac', 'other'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['submitted', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'submitted',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    images: [{
      type: String,
    }],
    completionImages: [{
      type: String,
    }],
    estimatedCost: {
      type: Number,
    },
    actualCost: {
      type: Number,
    },
    timeline: [timelineEntrySchema],
    scheduledDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    tenantRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tenantFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering by status and priority
maintenanceSchema.index({ ownerId: 1, status: 1, priority: 1 });
maintenanceSchema.index({ assignedTo: 1, status: 1 });

const Maintenance = mongoose.model<IMaintenance>('Maintenance', maintenanceSchema);

export default Maintenance;
