import mongoose, { Schema } from 'mongoose';
import { IPropertyStaff } from '../types/index.js';

const propertyStaffSchema = new Schema<IPropertyStaff>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['manager', 'marketing', 'technician', 'guard', 'cleaner'],
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: ['view', 'edit', 'delete', 'manage_staff', 'manage_tenants', 'manage_maintenance'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one user can only have one role per property
propertyStaffSchema.index({ propertyId: 1, userId: 1 }, { unique: true });

// Index for querying staff by property
propertyStaffSchema.index({ propertyId: 1, isActive: 1 });

// Index for querying properties by staff
propertyStaffSchema.index({ userId: 1, isActive: 1 });

const PropertyStaff = mongoose.model<IPropertyStaff>('PropertyStaff', propertyStaffSchema);

export default PropertyStaff;
