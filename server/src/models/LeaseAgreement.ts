import mongoose, { Schema, Document, Types } from 'mongoose';

export type LeaseStatus =
  | 'draft'
  | 'pending_owner_signature'
  | 'pending_tenant_signature'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'renewed'
  | 'terminated';

export type TerminationReasonCode =
  | 'end_of_term'
  | 'tenant_request'
  | 'owner_request'
  | 'non_payment'
  | 'breach_of_contract'
  | 'mutual_agreement'
  | 'other';

export interface ISignature {
  signerUserId: Types.ObjectId;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  documentSha256AtSigning: string;
  signatureNonce: string;
  signatureHash: string;
}

export interface ILeaseAgreement extends Document {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitId: Types.ObjectId;
  ownerId: Types.ObjectId;
  templateId?: Types.ObjectId;
  version: number;
  parentLeaseId?: Types.ObjectId;
  status: LeaseStatus;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  depositAmount: number;
  currency: string;
  terms: Record<string, string>;
  generatedPdfDocumentId?: Types.ObjectId;
  generatedPdfSha256?: string;
  ownerSignature?: ISignature;
  tenantSignature?: ISignature;
  terminationReasonCode?: TerminationReasonCode;
  terminationReasonText?: string;
  terminatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const signatureSchema = new Schema(
  {
    signerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    signedAt: { type: Date, required: true },
    ipAddress: { type: String, required: true, maxlength: 45 },
    userAgent: { type: String, required: true, maxlength: 500 },
    documentSha256AtSigning: { type: String, required: true, maxlength: 64 },
    signatureNonce: { type: String, required: true },
    signatureHash: { type: String, required: true },
  },
  { _id: false }
);

const leaseAgreementSchema = new Schema<ILeaseAgreement>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'LeaseTemplate' },
    version: { type: Number, required: true, default: 1 },
    parentLeaseId: { type: Schema.Types.ObjectId, ref: 'LeaseAgreement' },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_owner_signature',
        'pending_tenant_signature',
        'active',
        'expiring_soon',
        'expired',
        'renewed',
        'terminated',
      ],
      default: 'draft',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    monthlyRent: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    currency: { type: String, default: 'ETB', maxlength: 10 },
    terms: { type: Schema.Types.Mixed, default: {} },
    generatedPdfDocumentId: { type: Schema.Types.ObjectId, ref: 'TenantDocument' },
    generatedPdfSha256: { type: String, maxlength: 64 },
    ownerSignature: { type: signatureSchema },
    tenantSignature: { type: signatureSchema },
    terminationReasonCode: {
      type: String,
      enum: [
        'end_of_term',
        'tenant_request',
        'owner_request',
        'non_payment',
        'breach_of_contract',
        'mutual_agreement',
        'other',
      ],
    },
    terminationReasonText: { type: String, maxlength: 500 },
    terminatedAt: { type: Date },
  },
  { timestamps: true }
);

leaseAgreementSchema.index({ status: 1, ownerId: 1 });
leaseAgreementSchema.index({ endDate: 1, status: 1 });

const LeaseAgreementModel = mongoose.model<ILeaseAgreement>('LeaseAgreement', leaseAgreementSchema);
export default LeaseAgreementModel;
