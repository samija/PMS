import { IsMongoId, IsOptional, IsInt, Min, Max } from 'class-validator';

export class OfferUnitDto {
  @IsMongoId({ message: 'Invalid unit ID' })
  unitId!: string;

  @IsOptional()
  @IsInt({ message: 'Expires in days must be an integer' })
  @Min(1, { message: 'Expires in days must be at least 1' })
  @Max(30, { message: 'Expires in days cannot exceed 30' })
  expiresInDays?: number;
}
