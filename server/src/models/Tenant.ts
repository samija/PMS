import mongoose, { Schema } from 'mongoose';
import { ITenant } from '../types/index.js';

const leaseAgreementSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    monthlyRent: { type: Number, required: true },
    deposit: { type: Number, required: true },
    terms: { type: String },
  },
  { _id: false }
);

const emergencyContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['agreement', 'national_id', 'passport', 'other'],
      required: true,
    },
    name: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const tenantSchema = new Schema<ITenant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leaseAgreement: {
      type: leaseAgreementSchema,
      required: true,
    },
    emergencyContact: {
      type: emergencyContactSchema,
    },
    documents: [documentSchema],
    status: {
      type: String,
      enum: ['active', 'pending', 'terminated'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active tenants
tenantSchema.index({ status: 1, ownerId: 1 });

const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);

export default Tenant;
