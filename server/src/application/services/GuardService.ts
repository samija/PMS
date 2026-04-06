import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IGuardShift } from '../../types/index.js';
import {
  IGuardService,
  CreateGuardShiftData,
  UpdateGuardShiftData,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class GuardService implements IGuardService {
  private guardShiftModel: Model<IGuardShift>;

  constructor(@inject(TYPES.GuardShiftModel) guardShiftModel: Model<IGuardShift>) {
    this.guardShiftModel = guardShiftModel;
  }

  async createShift(data: CreateGuardShiftData): Promise<IGuardShift> {
    // Check for conflicting shifts
    const conflict = await this.guardShiftModel.findOne({
      propertyId: data.propertyId,
      guardId: data.guardId,
      shiftType: data.shiftType,
      isActive: true,
    });
    if (conflict) {
      throw new BadRequestError('Guard already has an active shift of this type at this property');
    }

    const shift = await this.guardShiftModel.create(data);
    return shift.populate([
      { path: 'guardId', select: 'name email phone avatar' },
      { path: 'assignedBy', select: 'name email' },
    ]);
  }

  async getShifts(propertyId: string, options: { guardId?: string; isActive?: boolean } = {}): Promise<IGuardShift[]> {
    const query: any = { propertyId };
    if (options.guardId) query.guardId = options.guardId;
    if (options.isActive !== undefined) query.isActive = options.isActive;

    return this.guardShiftModel.find(query)
      .populate('guardId', 'name email phone avatar')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async updateShift(propertyId: string, shiftId: string, data: UpdateGuardShiftData): Promise<IGuardShift> {
    const shift = await this.guardShiftModel.findOneAndUpdate(
      { _id: shiftId, propertyId },
      data,
      { new: true, runValidators: true }
    )
      .populate('guardId', 'name email phone avatar')
      .populate('assignedBy', 'name email');
    if (!shift) throw new NotFoundError('Guard shift', shiftId);
    return shift;
  }

  async deleteShift(propertyId: string, shiftId: string): Promise<void> {
    const result = await this.guardShiftModel.findOneAndDelete({ _id: shiftId, propertyId });
    if (!result) throw new NotFoundError('Guard shift', shiftId);
  }

  async getWeeklySchedule(propertyId: string): Promise<any> {
    const shifts = await this.guardShiftModel.find({ propertyId, isActive: true })
      .populate('guardId', 'name email phone avatar')
      .sort({ shiftType: 1 });

    // Group by day of week
    const schedule: Record<number, any[]> = {};
    for (let day = 0; day <= 6; day++) {
      schedule[day] = shifts.filter((s) => s.daysOfWeek.includes(day));
    }
    return schedule;
  }

  async getGuardPosts(propertyId: string): Promise<any> {
    const shifts = await this.guardShiftModel.find({ propertyId, isActive: true })
      .populate('guardId', 'name email phone avatar');

    // Group by guard post
    const posts: Record<string, any[]> = {};
    shifts.forEach((shift) => {
      if (!posts[shift.guardPost]) posts[shift.guardPost] = [];
      posts[shift.guardPost].push(shift);
    });
    return posts;
  }
}
