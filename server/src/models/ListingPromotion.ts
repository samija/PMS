import mongoose, { Schema, Document } from 'mongoose';

export interface IListingPromotion extends Document {
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  type: 'featured' | 'boosted' | 'premium';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  amount: number;
  paymentReference?: string;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const listingPromotionSchema = new Schema<IListingPromotion>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['featured', 'boosted', 'premium'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentReference: {
      type: String,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-deactivate expired promotions
listingPromotionSchema.index({ endDate: 1, isActive: 1 });

export default mongoose.model<IListingPromotion>('ListingPromotion', listingPromotionSchema);
