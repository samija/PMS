import mongoose, { Schema } from 'mongoose';
import { IAttendance } from '../types/index.js';

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: Date,
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
      default: 'present',
    },
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'GuardShift',
    },
    hoursWorked: Number,
    overtime: Number,
    notes: String,
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ propertyId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
