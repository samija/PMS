import { IsString, IsOptional, ValidateNested, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

class LeaseAgreementDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Monthly rent cannot be negative' })
  monthlyRent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Deposit cannot be negative' })
  deposit?: number;

  @IsOptional()
  @IsString()
  terms?: string;
}

class EmergencyContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  relationship?: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LeaseAgreementDto)
  leaseAgreement?: LeaseAgreementDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @IsOptional()
  @IsEnum(['active', 'pending', 'terminated'], {
    message: 'Status must be one of: active, pending, terminated'
  })
  status?: string;
}
