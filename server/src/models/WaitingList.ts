import mongoose, { Schema } from 'mongoose';
import { IWaitingList } from '../types/index.js';

const applicationSchema = new Schema(
  {
    employmentInfo: { type: String },
    income: { type: Number },
    references: [{ type: String }],
    documents: [{ type: String }],
    notes: { type: String },
  },
  { _id: false }
);

const waitingListSchema = new Schema<IWaitingList>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['queue', 'application'],
      required: true,
    },
    position: {
      type: Number,
    },
    application: {
      type: applicationSchema,
    },
    status: {
      type: String,
      enum: ['waiting', 'offered', 'accepted', 'rejected', 'expired'],
      default: 'waiting',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    offeredAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queue position
waitingListSchema.index({ propertyId: 1, unitId: 1, status: 1, position: 1 });

// Static method to get next position in queue
waitingListSchema.statics.getNextPosition = async function (
  propertyId: mongoose.Types.ObjectId,
  unitId?: mongoose.Types.ObjectId
): Promise<number> {
  const query: any = {
    propertyId,
    type: 'queue',
    status: 'waiting',
  };
  if (unitId) {
    query.unitId = unitId;
  }

  const lastEntry = await this.findOne(query).sort({ position: -1 });
  return lastEntry ? lastEntry.position + 1 : 1;
};

const WaitingList = mongoose.model<IWaitingList>('WaitingList', waitingListSchema);

export default WaitingList;
