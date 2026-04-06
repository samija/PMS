import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovePaymentDto {
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
