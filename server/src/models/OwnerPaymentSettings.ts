import mongoose, { Schema } from 'mongoose';
import { IOwnerPaymentSettings, EthiopianBank } from '../types/index.js';

// List of supported Ethiopian banks
export const ETHIOPIAN_BANKS: EthiopianBank[] = [
  'CBE',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'United Bank',
  'Nib International Bank',
  'Zemen Bank',
  'Cooperative Bank of Oromia',
  'Abay Bank',
  'Berhan Bank',
  'Bunna International Bank',
];

const bankDetailsSchema = new Schema(
  {
    bankName: {
      type: String,
      enum: ETHIOPIAN_BANKS,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const ownerPaymentSettingsSchema = new Schema<IOwnerPaymentSettings>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    preferredPaymentMethod: {
      type: String,
      enum: ['chapa', 'telebirr', 'santimpay', 'bank_transfer'],
      default: 'chapa',
    },
    bankDetails: {
      type: bankDetailsSchema,
    },
    paymentInstructions: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    requireVerifiedIdentityToActivateTenant: {
      type: Boolean,
      default: true,
    },
    mandatoryKycDocuments: {
      type: [String],
      default: ['national_id', 'proof_of_address', 'proof_of_income'],
    },
    retentionYears: {
      type: Number,
      default: 7,
      min: 1,
      max: 99,
    },
  },
  {
    timestamps: true,
  }
);

const OwnerPaymentSettings = mongoose.model<IOwnerPaymentSettings>(
  'OwnerPaymentSettings',
  ownerPaymentSettingsSchema
);

export default OwnerPaymentSettings;
