import { IsString, IsEnum, IsOptional, IsArray, MinLength } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title!: string;

  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description!: string;

  @IsEnum(['plumbing', 'electrical', 'appliance', 'structural', 'hvac', 'other'], {
    message: 'Category must be one of: plumbing, electrical, appliance, structural, hvac, other',
  })
  category!: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'emergency'], {
    message: 'Priority must be one of: low, medium, high, emergency',
  })
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
