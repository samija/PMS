import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITenantAuditLogEntry extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: 'identity' | 'document' | 'lease' | 'verification' | 'tenant';
  entityId: Types.ObjectId;
  tenantId?: Types.ObjectId;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reasonCode?: string;
  note?: string;
  correlationId?: string;
  ip?: string;
  userAgent?: string;
  at: Date;
}

const tenantAuditLogSchema = new Schema<ITenantAuditLogEntry>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true, maxlength: 30 },
    action: { type: String, required: true, maxlength: 100 },
    entityType: {
      type: String,
      enum: ['identity', 'document', 'lease', 'verification', 'tenant'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reasonCode: { type: String, maxlength: 50 },
    note: { type: String, maxlength: 500 },
    correlationId: { type: String, maxlength: 100, index: true },
    ip: { type: String, maxlength: 45 },
    userAgent: { type: String, maxlength: 500 },
    at: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false }
);

tenantAuditLogSchema.index({ entityType: 1, entityId: 1, at: -1 });
tenantAuditLogSchema.index({ tenantId: 1, at: -1 });

const TenantAuditLogModel = mongoose.model<ITenantAuditLogEntry>('TenantAuditLog', tenantAuditLogSchema);
export default TenantAuditLogModel;
