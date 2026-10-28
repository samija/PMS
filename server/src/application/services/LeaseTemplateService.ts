import { injectable, inject } from 'inversify';
import { Types } from 'mongoose';
import TYPES from '../../config/types.js';
import { LeaseTemplateRepository } from '../../infrastructure/repositories/LeaseTemplateRepository.js';
import { ILeaseTemplate } from '../../models/LeaseTemplate.js';
import { NotFoundError, ForbiddenError } from '../../domain/exceptions/AppError.js';

@injectable()
export class LeaseTemplateService {
  constructor(@inject(TYPES.LeaseTemplateRepository) private repo: LeaseTemplateRepository) {}

  async findAvailable(ownerId?: string): Promise<ILeaseTemplate[]> {
    return this.repo.findAllAvailable(ownerId);
  }

  async findById(id: string): Promise<ILeaseTemplate> {
    const tpl = await this.repo.findById(id);
    if (!tpl) throw new NotFoundError('LeaseTemplate', id);
    return tpl;
  }

  async create(data: {
    name: string;
    description?: string;
    ownerId: string;
    sections: any[];
    placeholders: string[];
  }): Promise<ILeaseTemplate> {
    return this.repo.create({
      name: data.name,
      description: data.description,
      ownerId: new Types.ObjectId(data.ownerId),
      isPlatformDefault: false,
      sections: data.sections,
      placeholders: data.placeholders,
    } as any);
  }

  async update(id: string, ownerId: string, patch: Partial<ILeaseTemplate>): Promise<ILeaseTemplate> {
    const tpl = await this.repo.findById(id);
    if (!tpl) throw new NotFoundError('LeaseTemplate', id);
    if (tpl.isPlatformDefault) throw new ForbiddenError('Cannot modify platform default template');
    if (tpl.ownerId?.toString() !== ownerId) throw new ForbiddenError('You can only modify your own templates');
    return this.repo.update(id, patch) as Promise<ILeaseTemplate>;
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const tpl = await this.repo.findById(id);
    if (!tpl) throw new NotFoundError('LeaseTemplate', id);
    if (tpl.isPlatformDefault) throw new ForbiddenError('Cannot delete platform default template');
    if (tpl.ownerId?.toString() !== ownerId) throw new ForbiddenError('You can only delete your own templates');
    await this.repo.delete(id);
  }
}
