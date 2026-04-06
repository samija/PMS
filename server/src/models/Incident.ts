import mongoose, { Schema } from 'mongoose';
import { IIncident } from '../types/index.js';

const incidentSchema = new Schema<IIncident>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    incidentType: {
      type: String,
      enum: ['theft', 'vandalism', 'unauthorized_access', 'disturbance', 'fire', 'flood', 'medical', 'suspicious_activity', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    occurredAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved', 'closed'],
      default: 'reported',
    },
    resolution: String,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    witnesses: [String],
    images: [String],
    policeReportFiled: {
      type: Boolean,
      default: false,
    },
    policeReportNumber: String,
  },
  {
    timestamps: true,
  }
);

incidentSchema.index({ propertyId: 1, status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ occurredAt: -1 });

const Incident = mongoose.model<IIncident>('Incident', incidentSchema);

export default Incident;
