import { IsString, IsEmail, IsOptional, IsMongoId, ValidateNested, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

class LeaseAgreementDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  @Min(0, { message: 'Monthly rent cannot be negative' })
  monthlyRent!: number;

  @IsNumber()
  @Min(0, { message: 'Deposit cannot be negative' })
  deposit!: number;

  @IsOptional()
  @IsString()
  terms?: string;
}

class EmergencyContactDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  relationship!: string;
}

export class CreateTenantDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsMongoId({ message: 'Invalid property ID' })
  propertyId!: string;

  @IsMongoId({ message: 'Invalid unit ID' })
  unitId!: string;

  @ValidateNested()
  @Type(() => LeaseAgreementDto)
  leaseAgreement!: LeaseAgreementDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;
}
