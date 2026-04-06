import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min } from 'class-validator';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Floor must be at least 1' })
  floor?: number;

  @IsOptional()
  @IsEnum(['studio', '1bed', '2bed', '3bed', 'office', 'shop', 'warehouse'], {
    message: 'Type must be one of: studio, 1bed, 2bed, 3bed, office, shop, warehouse'
  })
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Size must be at least 1 square meter' })
  size?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Base price cannot be negative' })
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Amenity charges cannot be negative' })
  amenityCharges?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsEnum(['vacant', 'occupied', 'reserved', 'maintenance'], {
    message: 'Status must be one of: vacant, occupied, reserved, maintenance'
  })
  status?: string;
}
