import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IIncident } from '../../types/index.js';
import {
  IIncidentService,
  CreateIncidentData,
  UpdateIncidentData,
  IncidentQueryOptions,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class IncidentService implements IIncidentService {
  private incidentModel: Model<IIncident>;

  constructor(@inject(TYPES.IncidentModel) incidentModel: Model<IIncident>) {
    this.incidentModel = incidentModel;
  }

  async reportIncident(data: CreateIncidentData): Promise<IIncident> {
    const incident = await this.incidentModel.create(data);
    return incident.populate([
      { path: 'reportedBy', select: 'name email phone role avatar' },
      { path: 'propertyId', select: 'name address' },
    ]);
  }

  async getIncidents(propertyId: string, options: IncidentQueryOptions = {}): Promise<any> {
    const { page = 1, limit = 10, status, severity, incidentType } = options;
    const query: any = { propertyId };
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (incidentType) query.incidentType = incidentType;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.incidentModel.find(query)
        .populate('reportedBy', 'name email phone avatar')
        .populate('resolvedBy', 'name email')
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limit),
      this.incidentModel.countDocuments(query),
    ]);

    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getIncident(propertyId: string, id: string): Promise<IIncident> {
    const incident = await this.incidentModel.findOne({ _id: id, propertyId })
      .populate('reportedBy', 'name email phone avatar')
      .populate('resolvedBy', 'name email')
      .populate('propertyId', 'name address');
    if (!incident) throw new NotFoundError('Incident', id);
    return incident;
  }

  async updateIncident(propertyId: string, id: string, data: UpdateIncidentData): Promise<IIncident> {
    const incident = await this.incidentModel.findOneAndUpdate(
      { _id: id, propertyId },
      data,
      { new: true, runValidators: true }
    )
      .populate('reportedBy', 'name email phone avatar')
      .populate('resolvedBy', 'name email');
    if (!incident) throw new NotFoundError('Incident', id);
    return incident;
  }

  async updateIncidentStatus(propertyId: string, id: string, status: string, resolution?: string, resolvedBy?: string): Promise<IIncident> {
    const updates: any = { status };
    if (resolution) updates.resolution = resolution;
    if (resolvedBy && (status === 'resolved' || status === 'closed')) {
      updates.resolvedBy = resolvedBy;
      updates.resolvedAt = new Date();
    }

    const incident = await this.incidentModel.findOneAndUpdate(
      { _id: id, propertyId },
      updates,
      { new: true, runValidators: true }
    )
      .populate('reportedBy', 'name email phone avatar')
      .populate('resolvedBy', 'name email');
    if (!incident) throw new NotFoundError('Incident', id);
    return incident;
  }
}
