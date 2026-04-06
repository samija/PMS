import { IsMongoId, IsOptional, IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class AssignTechnicianDto {
  @IsMongoId({ message: 'Invalid technician ID' })
  technicianId!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Scheduled date must be a valid date' })
  scheduledDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Estimated cost must be a number' })
  @Min(0, { message: 'Estimated cost cannot be negative' })
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
