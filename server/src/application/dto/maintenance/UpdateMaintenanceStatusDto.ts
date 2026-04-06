import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMaintenanceStatusDto {
  @IsEnum(['submitted', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled'], {
    message: 'Status must be one of: submitted, acknowledged, assigned, in_progress, completed, cancelled',
  })
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
