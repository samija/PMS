import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IAttendance } from '../../types/index.js';
import {
  IAttendanceService,
  CheckInData,
  CheckOutData,
  AttendanceQueryOptions,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class AttendanceService implements IAttendanceService {
  private attendanceModel: Model<IAttendance>;

  constructor(@inject(TYPES.AttendanceModel) attendanceModel: Model<IAttendance>) {
    this.attendanceModel = attendanceModel;
  }

  async checkIn(data: CheckInData): Promise<IAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.attendanceModel.findOne({
      employeeId: data.employeeId,
      date: today,
    });
    if (existing) throw new BadRequestError('Already checked in today');

    const attendance = await this.attendanceModel.create({
      employeeId: data.employeeId,
      propertyId: data.propertyId,
      date: today,
      checkIn: new Date(),
      status: 'present',
      shiftId: data.shiftId,
      notes: data.notes,
      recordedBy: data.recordedBy,
    });
    return attendance.populate([
      { path: 'employeeId', select: 'name email phone role avatar' },
      { path: 'recordedBy', select: 'name email' },
    ]);
  }

  async checkOut(data: CheckOutData): Promise<IAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceModel.findOne({
      employeeId: data.employeeId,
      date: today,
      checkOut: null,
    });
    if (!attendance) throw new NotFoundError('Active check-in for today');

    attendance.checkOut = new Date();
    const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
    attendance.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    attendance.overtime = Math.max(0, attendance.hoursWorked - 8);
    if (data.notes) attendance.notes = data.notes;

    await attendance.save();
    return attendance.populate([
      { path: 'employeeId', select: 'name email phone role avatar' },
      { path: 'recordedBy', select: 'name email' },
    ]);
  }

  async getDailyAttendance(propertyId: string, date?: string): Promise<IAttendance[]> {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return this.attendanceModel.find({
      propertyId,
      date: { $gte: targetDate, $lt: nextDay },
    })
      .populate('employeeId', 'name email phone role avatar')
      .populate('shiftId')
      .populate('recordedBy', 'name email')
      .sort({ checkIn: -1 });
  }

  async getMonthlyReport(propertyId: string, month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.attendanceModel.find({
      propertyId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('employeeId', 'name email role');

    const summary = records.reduce((acc: any, record) => {
      const empId = record.employeeId.toString();
      if (!acc[empId]) {
        acc[empId] = { employee: record.employeeId, present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, totalHours: 0, totalOvertime: 0 };
      }
      acc[empId][record.status === 'half_day' ? 'halfDay' : record.status === 'on_leave' ? 'onLeave' : record.status]++;
      acc[empId].totalHours += record.hoursWorked || 0;
      acc[empId].totalOvertime += record.overtime || 0;
      return acc;
    }, {});

    return { records, summary: Object.values(summary) };
  }

  async getEmployeeAttendance(employeeId: string, options: AttendanceQueryOptions = {}): Promise<any> {
    const { page = 1, limit = 30 } = options;
    const query: any = { employeeId };
    if (options.status) query.status = options.status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.attendanceModel.find(query)
        .populate('propertyId', 'name')
        .populate('shiftId')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      this.attendanceModel.countDocuments(query),
    ]);

    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
