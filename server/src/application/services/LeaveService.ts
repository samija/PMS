import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { ILeaveRequest } from '../../types/index.js';
import {
  ILeaveService,
  CreateLeaveRequestData,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class LeaveService implements ILeaveService {
  private leaveRequestModel: Model<ILeaveRequest>;

  constructor(@inject(TYPES.LeaveRequestModel) leaveRequestModel: Model<ILeaveRequest>) {
    this.leaveRequestModel = leaveRequestModel;
  }

  async submitRequest(data: CreateLeaveRequestData): Promise<ILeaveRequest> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping requests
    const overlap = await this.leaveRequestModel.findOne({
      employeeId: data.employeeId,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    if (overlap) throw new BadRequestError('Overlapping leave request exists');

    const request = await this.leaveRequestModel.create({
      ...data,
      totalDays,
      status: 'pending',
    });
    return request.populate([
      { path: 'employeeId', select: 'name email phone role avatar' },
      { path: 'propertyId', select: 'name' },
    ]);
  }

  async getRequests(options: { employeeId?: string; propertyId?: string; status?: string; page?: number; limit?: number } = {}): Promise<any> {
    const { page = 1, limit = 10 } = options;
    const query: any = {};
    if (options.employeeId) query.employeeId = options.employeeId;
    if (options.propertyId) query.propertyId = options.propertyId;
    if (options.status) query.status = options.status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.leaveRequestModel.find(query)
        .populate('employeeId', 'name email phone role avatar')
        .populate('approvedBy', 'name email')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.leaveRequestModel.countDocuments(query),
    ]);

    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async approveRequest(id: string, approvedBy: string): Promise<ILeaveRequest> {
    const request = await this.leaveRequestModel.findByIdAndUpdate(
      id,
      { status: 'approved', approvedBy, approvedAt: new Date() },
      { new: true }
    ).populate('employeeId', 'name email phone role avatar');
    if (!request) throw new NotFoundError('Leave request', id);
    return request;
  }

  async rejectRequest(id: string, rejectedBy: string, reason: string): Promise<ILeaveRequest> {
    const request = await this.leaveRequestModel.findByIdAndUpdate(
      id,
      { status: 'rejected', approvedBy: rejectedBy, rejectionReason: reason },
      { new: true }
    ).populate('employeeId', 'name email phone role avatar');
    if (!request) throw new NotFoundError('Leave request', id);
    return request;
  }

  async cancelRequest(id: string, employeeId: string): Promise<ILeaveRequest> {
    const request = await this.leaveRequestModel.findOneAndUpdate(
      { _id: id, employeeId, status: 'pending' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!request) throw new NotFoundError('Leave request', id);
    return request;
  }

  async getLeaveBalance(employeeId: string): Promise<any> {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const approved = await this.leaveRequestModel.find({
      employeeId,
      status: 'approved',
      startDate: { $gte: startOfYear, $lte: endOfYear },
    });

    const used: Record<string, number> = {};
    approved.forEach((r) => {
      used[r.leaveType] = (used[r.leaveType] || 0) + r.totalDays;
    });

    const annualAllowance = 20;
    const sickAllowance = 10;

    return {
      year: currentYear,
      annual: { allowed: annualAllowance, used: used['annual'] || 0, remaining: annualAllowance - (used['annual'] || 0) },
      sick: { allowed: sickAllowance, used: used['sick'] || 0, remaining: sickAllowance - (used['sick'] || 0) },
      personal: { used: used['personal'] || 0 },
      emergency: { used: used['emergency'] || 0 },
      totalUsed: Object.values(used).reduce((a, b) => a + b, 0),
    };
  }
}
