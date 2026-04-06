import { IsOptional, IsNumber, IsArray, IsString, Min } from 'class-validator';

export class CompleteMaintenanceDto {
  @IsOptional()
  @IsNumber({}, { message: 'Actual cost must be a number' })
  @Min(0, { message: 'Actual cost cannot be negative' })
  actualCost?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completionImages?: string[];

  @IsOptional()
  @IsString()
  note?: string;
}
