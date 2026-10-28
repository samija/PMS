import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILeaseTemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  ownerId?: Types.ObjectId;
  isPlatformDefault: boolean;
  sections: ITemplateSection[];
  placeholders: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateSection {
  title: string;
  body: string;
  order: number;
}

const templateSectionSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 10000 },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const leaseTemplateSchema = new Schema<ILeaseTemplate>(
  {
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    isPlatformDefault: { type: Boolean, default: false },
    sections: [templateSectionSchema],
    placeholders: [{ type: String, maxlength: 50 }],
  },
  { timestamps: true }
);

leaseTemplateSchema.index({ isPlatformDefault: 1 });

const LeaseTemplateModel = mongoose.model<ILeaseTemplate>('LeaseTemplate', leaseTemplateSchema);
export default LeaseTemplateModel;
