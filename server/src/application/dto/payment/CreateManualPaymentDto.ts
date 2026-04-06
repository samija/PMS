import { IsMongoId, IsNumber, IsInt, IsEnum, IsOptional, IsDateString, IsString, Min, Max } from 'class-validator';

export class CreateManualPaymentDto {
  @IsMongoId({ message: 'Invalid tenant ID' })
  tenantId!: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be greater than 0' })
  amount!: number;

  @IsEnum(['rent', 'deposit', 'maintenance', 'utility', 'penalty'], {
    message: 'Type must be one of: rent, deposit, maintenance, utility, penalty',
  })
  type!: string;

  @IsInt({ message: 'Month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  month!: number;

  @IsInt({ message: 'Year must be an integer' })
  @Min(2020, { message: 'Year must be 2020 or later' })
  year!: number;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
