import mongoose, { Schema } from 'mongoose';
import { IEmployee } from '../types/index.js';

const employeeSchema = new Schema<IEmployee>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      unique: true,
    },
    personalInfo: {
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['male', 'female'],
      },
      nationalId: String,
      address: String,
      city: String,
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
    },
    employment: {
      position: {
        type: String,
        required: true,
      },
      department: {
        type: String,
        enum: ['security', 'maintenance', 'cleaning', 'management', 'marketing'],
        required: true,
      },
      employmentType: {
        type: String,
        enum: ['full_time', 'part_time', 'contract'],
        default: 'full_time',
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: Date,
      status: {
        type: String,
        enum: ['active', 'on_leave', 'suspended', 'terminated'],
        default: 'active',
      },
    },
    salary: {
      baseSalary: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'ETB',
      },
      paymentFrequency: {
        type: String,
        enum: ['monthly', 'biweekly', 'weekly'],
        default: 'monthly',
      },
      bankName: {
        type: String,
        enum: [
          'CBE', 'Awash Bank', 'Dashen Bank', 'Bank of Abyssinia',
          'Wegagen Bank', 'United Bank', 'Nib International Bank',
          'Zemen Bank', 'Cooperative Bank of Oromia', 'Abay Bank',
          'Berhan Bank', 'Bunna International Bank',
        ],
      },
      bankAccountNumber: String,
    },
    documents: [
      {
        type: { type: String },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate employeeId before save
employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

employeeSchema.index({ userId: 1 }, { unique: true });
employeeSchema.index({ 'employment.department': 1 });
employeeSchema.index({ 'employment.status': 1 });

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);

export default Employee;
