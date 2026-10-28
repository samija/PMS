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

const encryptedFieldSchema = new Schema(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    keyVersion: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const permanentAddressSchema = new Schema(
  {
    street: { type: String, maxlength: 200 },
    city: { type: String, maxlength: 100 },
    region: { type: String, maxlength: 100 },
    country: { type: String, maxlength: 100 },
    postalCode: { type: String, maxlength: 20 },
  },
  { _id: false }
);

const priorReferenceSchema = new Schema(
  {
    landlordName: { type: String, required: true, maxlength: 100 },
    landlordPhone: { type: String, required: true, maxlength: 20 },
    propertyName: { type: String, maxlength: 200 },
    tenancyStart: { type: Date },
    tenancyEnd: { type: Date },
  },
  { _id: false }
);

const nextOfKinSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    relationship: { type: String, required: true, maxlength: 50 },
    phone: { type: String, required: true, maxlength: 20 },
    address: { type: String, maxlength: 300 },
  },
  { _id: false }
);

const identityProfileSchema = new Schema(
  {
    dateOfBirth: { type: Date },
    nationalIdNumber: { type: encryptedFieldSchema },
    passportNumber: { type: encryptedFieldSchema },
    passportCountry: { type: String, maxlength: 100 },
    nationality: { type: String, maxlength: 100 },
    permanentAddress: { type: permanentAddressSchema },
    occupation: { type: String, maxlength: 100 },
    employer: { type: String, maxlength: 200 },
    employerPhone: { type: String, maxlength: 20 },
    incomeAmount: { type: encryptedFieldSchema },
    incomeCurrency: { type: String, maxlength: 10, default: 'ETB' },
    incomeSource: { type: String, maxlength: 100 },
    references: [priorReferenceSchema],
    nextOfKin: { type: nextOfKinSchema },
  },
  { _id: false }
);

const identityVerificationSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['not_started', 'pending', 'in_review', 'verified', 'rejected', 'expired', 'requires_resubmission'],
      default: 'not_started',
    },
    updatedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reasonCode: {
      type: String,
      enum: ['blurry_document', 'expired_document', 'mismatch', 'incomplete', 'fraudulent', 'wrong_document_type', 'other'],
    },
    reasonText: { type: String, maxlength: 500 },
  },
  { _id: false }
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
    identityProfile: {
      type: identityProfileSchema,
    },
    identityVerification: {
      type: identityVerificationSchema,
      default: () => ({ status: 'not_started' }),
    },
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

tenantSchema.index({ status: 1, ownerId: 1 });
tenantSchema.index({ 'identityVerification.status': 1, ownerId: 1 });

const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);

export default Tenant;
