import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateWaitingListStatusDto {
  @IsEnum(['waiting', 'offered', 'accepted', 'rejected', 'expired'], {
    message: 'Status must be one of: waiting, offered, accepted, rejected, expired',
  })
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
