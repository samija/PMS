import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { VerificationStatus, RejectionReasonCode } from '../../../types/index.js';

export class SetVerificationStatusDto {
  @IsEnum(['not_started', 'pending', 'in_review', 'verified', 'rejected', 'expired', 'requires_resubmission'], {
    message: 'Invalid verification status',
  })
  status!: VerificationStatus;

  @IsOptional()
  @IsEnum(
    ['blurry_document', 'expired_document', 'mismatch', 'incomplete', 'fraudulent', 'wrong_document_type', 'other'],
    {
      message: 'Invalid rejection reason code',
    }
  )
  reasonCode?: RejectionReasonCode;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}
