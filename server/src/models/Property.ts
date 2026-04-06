import mongoose, { Schema } from 'mongoose';
import { IProperty } from '../types/index.js';

const addressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'Ethiopia' },
    postalCode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const propertySchema = new Schema<IProperty>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['apartment', 'house', 'commercial', 'villa'],
      required: true,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    totalFloors: {
      type: Number,
      required: true,
      min: 1,
    },
    totalUnits: {
      type: Number,
      required: true,
      min: 1,
    },
    amenities: [{
      type: String,
    }],
    images: [{
      type: String,
    }],
    description: {
      type: String,
    },
    isListed: {
      type: Boolean,
      default: false,
    },
    listingStatus: {
      type: String,
      enum: ['available', 'occupied', 'maintenance'],
      default: 'available',
    },
    waitingListType: {
      type: String,
      enum: ['queue', 'application', 'both'],
      default: 'both',
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
propertySchema.index({ 'address.city': 1, isListed: 1 });
propertySchema.index({ type: 1, isListed: 1 });

const Property = mongoose.model<IProperty>('Property', propertySchema);

export default Property;
