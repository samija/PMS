import mongoose, { Schema } from 'mongoose';
import { IUnit } from '../types/index.js';

const pricingSchema = new Schema(
  {
    basePrice: { type: Number, required: true },
    floorMultiplier: { type: Number, default: 1 },
    amenityCharges: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const unitSchema = new Schema<IUnit>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    unitNumber: {
      type: String,
      required: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['studio', '1bed', '2bed', '3bed', 'office', 'shop', 'warehouse'],
      required: true,
    },
    size: {
      type: Number, // in square meters
      required: true,
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['vacant', 'occupied', 'reserved', 'maintenance'],
      default: 'vacant',
    },
    features: [{
      type: String,
    }],
    images: [{
      type: String,
    }],
    currentTenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    leaseStart: {
      type: Date,
    },
    leaseEnd: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique unit number per property
unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

// Index on status for frequent status-based queries
unitSchema.index({ status: 1 });

// Compound index for property + status queries (common filter pattern)
unitSchema.index({ propertyId: 1, status: 1 });

// Static method to calculate price with floor multiplier
unitSchema.statics.calculateTotalPrice = function (
  basePrice: number,
  floor: number,
  totalFloors: number,
  amenityCharges: number = 0
): { floorMultiplier: number; totalPrice: number } {
  // Higher floors have higher prices (up to 10% increase for top floor)
  const floorMultiplier = 1 + (floor / totalFloors) * 0.1;
  const totalPrice = Math.round(basePrice * floorMultiplier + amenityCharges);
  return { floorMultiplier, totalPrice };
};

const Unit = mongoose.model<IUnit>('Unit', unitSchema);

export default Unit;
