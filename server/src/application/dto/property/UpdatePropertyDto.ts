import { IsString, IsNumber, IsArray, IsOptional, IsEnum, ValidateNested, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['apartment', 'house', 'commercial', 'villa'], {
    message: 'Type must be one of: apartment, house, commercial, villa'
  })
  type?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsObject()
  address?: AddressDto;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Total floors must be at least 1' })
  totalFloors?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Total units must be at least 1' })
  totalUnits?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['queue', 'application', 'both'], {
    message: 'Waiting list type must be one of: queue, application, both'
  })
  waitingListType?: string;
}
