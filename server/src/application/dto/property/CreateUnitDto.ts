import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  unitNumber!: string;

  @IsNumber()
  @Min(1, { message: 'Floor must be at least 1' })
  floor!: number;

  @IsEnum(['studio', '1bed', '2bed', '3bed', 'office', 'shop', 'warehouse'], {
    message: 'Type must be one of: studio, 1bed, 2bed, 3bed, office, shop, warehouse'
  })
  type!: string;

  @IsNumber()
  @Min(1, { message: 'Size must be at least 1 square meter' })
  size!: number;

  @IsNumber()
  @Min(0, { message: 'Base price cannot be negative' })
  basePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Amenity charges cannot be negative' })
  amenityCharges?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
