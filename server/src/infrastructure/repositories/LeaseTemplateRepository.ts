import { injectable, inject } from 'inversify';
import { Model, Types } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { ILeaseTemplate } from '../../models/LeaseTemplate.js';
import TYPES from '../../config/types.js';

@injectable()
export class LeaseTemplateRepository extends BaseRepository<ILeaseTemplate> {
  constructor(@inject(TYPES.LeaseTemplateModel) model: Model<ILeaseTemplate>) {
    super(model);
  }

  async findAllAvailable(ownerId?: string): Promise<ILeaseTemplate[]> {
    const query: any = {
      $or: [{ isPlatformDefault: true }],
    };
    if (ownerId) {
      query.$or.push({ ownerId: new Types.ObjectId(ownerId) });
    }
    return this.model.find(query).sort({ isPlatformDefault: -1, name: 1 }).exec();
  }
}
