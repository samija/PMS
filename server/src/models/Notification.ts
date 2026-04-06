import mongoose, { Schema } from 'mongoose';
import { INotification } from '../types/index.js';

const relatedEntitySchema = new Schema(
  {
    type: {
      type: String,
      enum: ['payment', 'tenant', 'property', 'schedule'],
      required: true,
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['payment_due', 'payment_overdue', 'payment_received', 'payment_approved', 'payment_rejected', 'lease_expiring', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedEntity: {
      type: relatedEntitySchema,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    actionUrl: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding unread notifications
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Index for expiry cleanup
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding notifications by type
notificationSchema.index({ userId: 1, type: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
