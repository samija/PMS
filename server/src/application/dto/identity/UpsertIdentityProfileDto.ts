import { IsString, IsOptional, IsDateString, MaxLength, ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

class PermanentAddressDto {
  @IsOptional() @IsString() @MaxLength(200) street?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) region?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsString() @MaxLength(20) postalCode?: string;
}

class PriorReferenceDto {
  @IsString() @MaxLength(100) landlordName!: string;
  @IsString() @MaxLength(20) landlordPhone!: string;
  @IsOptional() @IsString() @MaxLength(200) propertyName?: string;
  @IsOptional() @IsDateString() tenancyStart?: string;
  @IsOptional() @IsDateString() tenancyEnd?: string;
}

class NextOfKinDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @MaxLength(50) relationship!: string;
  @IsString() @MaxLength(20) phone!: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
}

export class UpsertIdentityProfileDto {
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsString() @MaxLength(30) nationalIdNumber?: string;
  @IsOptional() @IsString() @MaxLength(30) passportNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) passportCountry?: string;
  @IsOptional() @IsString() @MaxLength(100) nationality?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermanentAddressDto)
  permanentAddress?: PermanentAddressDto;

  @IsOptional() @IsString() @MaxLength(100) occupation?: string;
  @IsOptional() @IsString() @MaxLength(200) employer?: string;
  @IsOptional() @IsString() @MaxLength(20) employerPhone?: string;
  @IsOptional() @IsString() @MaxLength(30) incomeAmount?: string;
  @IsOptional() @IsString() @MaxLength(10) incomeCurrency?: string;
  @IsOptional() @IsString() @MaxLength(100) incomeSource?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PriorReferenceDto)
  references?: PriorReferenceDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => NextOfKinDto)
  nextOfKin?: NextOfKinDto;
}
