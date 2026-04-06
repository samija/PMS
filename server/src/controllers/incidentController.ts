import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { IIncidentService } from '../domain/interfaces/IServices.js';

export const reportIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IIncidentService>(TYPES.IncidentService);
    const { propertyId } = req.params;
    const data = await service.reportIncident({
      ...req.body,
      propertyId,
      reportedBy: req.user!._id.toString(),
    });
    res.status(201).json({ success: true, message: 'Incident reported successfully', data });
  } catch (error: any) {
    console.error('Report incident error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to report incident' });
  }
};

export const getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IIncidentService>(TYPES.IncidentService);
    const { propertyId } = req.params;
    const { page, limit, status, severity, incidentType } = req.query;
    const data = await service.getIncidents(propertyId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string,
      severity: severity as string,
      incidentType: incidentType as string,
    });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get incidents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get incidents' });
  }
};

export const getIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IIncidentService>(TYPES.IncidentService);
    const { propertyId, id } = req.params;
    const data = await service.getIncident(propertyId, id);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Get incident error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to get incident' });
  }
};

export const updateIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IIncidentService>(TYPES.IncidentService);
    const { propertyId, id } = req.params;
    const data = await service.updateIncident(propertyId, id, req.body);
    res.json({ success: true, message: 'Incident updated', data });
  } catch (error: any) {
    console.error('Update incident error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update incident' });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = container.get<IIncidentService>(TYPES.IncidentService);
    const { propertyId, id } = req.params;
    const { status, resolution } = req.body;
    const data = await service.updateIncidentStatus(propertyId, id, status, resolution, req.user!._id.toString());
    res.json({ success: true, message: 'Incident status updated', data });
  } catch (error: any) {
    console.error('Update incident status error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to update status' });
  }
};
