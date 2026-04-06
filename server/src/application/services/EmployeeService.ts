import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IEmployee } from '../../types/index.js';
import {
  IEmployeeService,
  CreateEmployeeData,
  UpdateEmployeeData,
  EmployeeQueryOptions,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError, ConflictError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class EmployeeService implements IEmployeeService {
  private employeeModel: Model<IEmployee>;

  constructor(@inject(TYPES.EmployeeModel) employeeModel: Model<IEmployee>) {
    this.employeeModel = employeeModel;
  }

  async createEmployee(data: CreateEmployeeData): Promise<IEmployee> {
    const existing = await this.employeeModel.findOne({ userId: data.userId });
    if (existing) {
      throw new ConflictError('Employee profile already exists for this user');
    }

    const employee = await this.employeeModel.create({
      userId: data.userId,
      personalInfo: data.personalInfo || {},
      employment: {
        ...data.employment,
        status: 'active',
      },
      salary: {
        ...data.salary,
        currency: data.salary.currency || 'ETB',
        paymentFrequency: data.salary.paymentFrequency || 'monthly',
      },
    });

    return employee.populate('userId', 'name email phone role avatar');
  }

  async getEmployees(options: EmployeeQueryOptions = {}): Promise<any> {
    const { page = 1, limit = 10, department, status, search } = options;
    const query: any = {};
    
    if (department) query['employment.department'] = department;
    if (status) query['employment.status'] = status;

    const skip = (page - 1) * limit;
    
    let findQuery = this.employeeModel.find(query)
      .populate('userId', 'name email phone role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [employees, total] = await Promise.all([
      findQuery.exec(),
      this.employeeModel.countDocuments(query),
    ]);

    return {
      data: employees,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getEmployee(id: string): Promise<IEmployee> {
    const employee = await this.employeeModel.findById(id)
      .populate('userId', 'name email phone role avatar');
    if (!employee) throw new NotFoundError('Employee', id);
    return employee;
  }

  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<IEmployee> {
    const updates: any = {};
    if (data.personalInfo) {
      Object.entries(data.personalInfo).forEach(([key, value]) => {
        if (value !== undefined) updates[`personalInfo.${key}`] = value;
      });
    }
    if (data.employment) {
      Object.entries(data.employment).forEach(([key, value]) => {
        if (value !== undefined) updates[`employment.${key}`] = value;
      });
    }
    if (data.salary) {
      Object.entries(data.salary).forEach(([key, value]) => {
        if (value !== undefined) updates[`salary.${key}`] = value;
      });
    }

    const employee = await this.employeeModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('userId', 'name email phone role avatar');
    if (!employee) throw new NotFoundError('Employee', id);
    return employee;
  }

  async updateEmployeeStatus(id: string, status: string): Promise<IEmployee> {
    const employee = await this.employeeModel.findByIdAndUpdate(
      id,
      { 'employment.status': status },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone role avatar');
    if (!employee) throw new NotFoundError('Employee', id);
    return employee;
  }

  async addDocument(id: string, document: { type: string; url: string }): Promise<IEmployee> {
    const employee = await this.employeeModel.findByIdAndUpdate(
      id,
      { $push: { documents: { ...document, uploadedAt: new Date() } } },
      { new: true }
    ).populate('userId', 'name email phone role avatar');
    if (!employee) throw new NotFoundError('Employee', id);
    return employee;
  }
}
