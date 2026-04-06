import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import { IEmployeeService } from '../domain/interfaces/IServices.js';

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeService = container.get<IEmployeeService>(TYPES.EmployeeService);
    const data = req.body;

    const employee = await employeeService.createEmployee(data);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create employee',
    });
  }
};

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeService = container.get<IEmployeeService>(TYPES.EmployeeService);
    const { page, limit, department, status, search } = req.query;

    const options = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      department: department as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    };

    const result = await employeeService.getEmployees(options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get employees',
    });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeService = container.get<IEmployeeService>(TYPES.EmployeeService);
    const { id } = req.params;

    const employee = await employeeService.getEmployee(id);

    res.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    console.error('Get employee error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get employee',
    });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeService = container.get<IEmployeeService>(TYPES.EmployeeService);
    const { id } = req.params;
    const data = req.body;

    const employee = await employeeService.updateEmployee(id, data);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee',
    });
  }
};

export const updateEmployeeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeService = container.get<IEmployeeService>(TYPES.EmployeeService);
    const { id } = req.params;
    const { status } = req.body;

    const employee = await employeeService.updateEmployeeStatus(id, status);

    res.json({
      success: true,
      message: 'Employee status updated successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Update employee status error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to update employee status',
    });
  }
};

export const addEmployeeDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeService = container.get<IEmployeeService>(TYPES.EmployeeService);
    const { id } = req.params;
    const { type, url } = req.body;

    const employee = await employeeService.addDocument(id, { type, url });

    res.status(201).json({
      success: true,
      message: 'Document added successfully',
      data: employee,
    });
  } catch (error: any) {
    console.error('Add employee document error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add document',
    });
  }
};
