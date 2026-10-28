import mongoose, { Schema, Document, Types } from 'mongoose';

export type DocumentTypeV2 =
  | 'agreement'
  | 'national_id'
  | 'passport'
  | 'proof_of_address'
  | 'proof_of_income'
  | 'guarantor_id'
  | 'selfie'
  | 'power_of_attorney'
  | 'business_registration'
  | 'lease_amendment'
  | 'lease_renewal'
  | 'other';

export type DocumentSensitivity = 'public' | 'sensitive';

export type DocVerificationStatus =
  'not_started' | 'pending_scan' | 'scan_failed' | 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';

export interface ITenantDocumentV2 extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  type: DocumentTypeV2;
  name: string;
  url?: string;
  storageRef: string;
  sensitivity: DocumentSensitivity;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  version: number;
  previousVersionId?: Types.ObjectId;
  issueDate?: Date;
  expiryDate?: Date;
  documentNumber?: string;
  issuingCountry?: string;
  verificationStatus: DocVerificationStatus;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReasonCode?: string;
  rejectionReasonText?: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SENSITIVE_TYPES: DocumentTypeV2[] = [
  'national_id',
  'passport',
  'proof_of_income',
  'guarantor_id',
  'selfie',
  'power_of_attorney',
];

const tenantDocumentSchema = new Schema<ITenantDocumentV2>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: {
      type: String,
      enum: [
        'agreement',
        'national_id',
        'passport',
        'proof_of_address',
        'proof_of_income',
        'guarantor_id',
        'selfie',
        'power_of_attorney',
        'business_registration',
        'lease_amendment',
        'lease_renewal',
        'other',
      ],
      required: true,
    },
    name: { type: String, required: true, maxlength: 200 },
    url: { type: String },
    storageRef: { type: String, required: true },
    sensitivity: {
      type: String,
      enum: ['public', 'sensitive'],
      required: true,
    },
    mimeType: { type: String, required: true, maxlength: 100 },
    fileSizeBytes: { type: Number, required: true },
    sha256: { type: String, required: true, maxlength: 64 },
    version: { type: Number, required: true, default: 1 },
    previousVersionId: { type: Schema.Types.ObjectId, ref: 'TenantDocument' },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    documentNumber: { type: String, maxlength: 50 },
    issuingCountry: { type: String, maxlength: 100 },
    verificationStatus: {
      type: String,
      enum: ['not_started', 'pending_scan', 'scan_failed', 'pending', 'in_review', 'verified', 'rejected', 'expired'],
      default: 'pending_scan',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReasonCode: { type: String, maxlength: 50 },
    rejectionReasonText: { type: String, maxlength: 500 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

tenantDocumentSchema.index({ tenantId: 1, type: 1, version: -1 });
tenantDocumentSchema.index({ expiryDate: 1 }, { sparse: true });
tenantDocumentSchema.index({ verificationStatus: 1 });
tenantDocumentSchema.index({ deletedAt: 1 }, { sparse: true });

export function isSensitiveType(type: DocumentTypeV2): boolean {
  return SENSITIVE_TYPES.includes(type);
}

const TenantDocumentModel = mongoose.model<ITenantDocumentV2>('TenantDocument', tenantDocumentSchema);
export default TenantDocumentModel;
