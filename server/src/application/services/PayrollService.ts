import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IPayroll, IEmployee } from '../../types/index.js';
import {
  IPayrollService,
  GeneratePayrollData,
} from '../../domain/interfaces/IServices.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import TYPES from '../../config/types.js';

@injectable()
export class PayrollService implements IPayrollService {
  private payrollModel: Model<IPayroll>;
  private employeeModel: Model<IEmployee>;

  constructor(
    @inject(TYPES.PayrollModel) payrollModel: Model<IPayroll>,
    @inject(TYPES.EmployeeModel) employeeModel: Model<IEmployee>
  ) {
    this.payrollModel = payrollModel;
    this.employeeModel = employeeModel;
  }

  async generatePayroll(data: GeneratePayrollData): Promise<IPayroll[]> {
    // Find all active employees at the property (via PropertyStaff or by department)
    const employees = await this.employeeModel.find({
      'employment.status': 'active',
    }).populate('userId');

    const payrolls: IPayroll[] = [];
    for (const employee of employees) {
      // Check if payroll already exists for this period
      const existing = await this.payrollModel.findOne({
        employeeId: employee.userId,
        'period.month': data.month,
        'period.year': data.year,
      });
      if (existing) continue;

      const baseSalary = employee.salary.baseSalary;
      const grossPay = baseSalary;
      const taxDeduction = Math.round(baseSalary * 0.15);
      const pensionDeduction = Math.round(baseSalary * 0.07);
      const totalDeductions = taxDeduction + pensionDeduction;
      const netPay = grossPay - totalDeductions;

      const payroll = await this.payrollModel.create({
        employeeId: employee.userId,
        propertyId: data.propertyId,
        period: { month: data.month, year: data.year },
        baseSalary,
        overtime: { hours: 0, rate: 0, amount: 0 },
        deductions: [
          { type: 'tax', description: 'Income Tax (15%)', amount: taxDeduction },
          { type: 'pension', description: 'Pension (7%)', amount: pensionDeduction },
        ],
        bonuses: [],
        grossPay,
        totalDeductions,
        netPay,
        status: 'draft',
        paymentMethod: 'bank_transfer',
      });
      payrolls.push(payroll);
    }

    return payrolls;
  }

  async getPayrollRecords(propertyId: string, options: { month?: number; year?: number; status?: string; page?: number; limit?: number } = {}): Promise<any> {
    const { page = 1, limit = 10 } = options;
    const query: any = { propertyId };
    if (options.month) query['period.month'] = options.month;
    if (options.year) query['period.year'] = options.year;
    if (options.status) query.status = options.status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.payrollModel.find(query)
        .populate('employeeId', 'name email phone role avatar')
        .populate('paidBy', 'name email')
        .sort({ 'period.year': -1, 'period.month': -1 })
        .skip(skip)
        .limit(limit),
      this.payrollModel.countDocuments(query),
    ]);

    return { data, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getPayrollDetail(propertyId: string, id: string): Promise<IPayroll> {
    const payroll = await this.payrollModel.findOne({ _id: id, propertyId })
      .populate('employeeId', 'name email phone role avatar')
      .populate('paidBy', 'name email');
    if (!payroll) throw new NotFoundError('Payroll', id);
    return payroll;
  }

  async approvePayroll(propertyId: string, id: string, approvedBy: string): Promise<IPayroll> {
    const payroll = await this.payrollModel.findOneAndUpdate(
      { _id: id, propertyId, status: 'draft' },
      { status: 'approved' },
      { new: true }
    ).populate('employeeId', 'name email phone role avatar');
    if (!payroll) throw new NotFoundError('Payroll', id);
    return payroll;
  }

  async markAsPaid(propertyId: string, id: string, paidBy: string, paymentMethod: string, transactionRef?: string): Promise<IPayroll> {
    const updates: any = {
      status: 'paid',
      paidAt: new Date(),
      paidBy,
      paymentMethod,
    };
    if (transactionRef) updates.transactionRef = transactionRef;

    const payroll = await this.payrollModel.findOneAndUpdate(
      { _id: id, propertyId, status: 'approved' },
      updates,
      { new: true }
    ).populate('employeeId', 'name email phone role avatar');
    if (!payroll) throw new NotFoundError('Payroll', id);
    return payroll;
  }
}
