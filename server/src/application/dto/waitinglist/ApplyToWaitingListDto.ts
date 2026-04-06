import { IsMongoId, IsOptional, IsEnum, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ApplicationInfoDto {
  @IsOptional()
  @IsString()
  employmentInfo?: string;

  @IsOptional()
  @IsNumber()
  income?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApplyToWaitingListDto {
  @IsMongoId({ message: 'Invalid property ID' })
  propertyId!: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid unit ID' })
  unitId?: string;

  @IsOptional()
  @IsEnum(['queue', 'application'], {
    message: 'Type must be either queue or application',
  })
  type?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationInfoDto)
  application?: ApplicationInfoDto;
}
