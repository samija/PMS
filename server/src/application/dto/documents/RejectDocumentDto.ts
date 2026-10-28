import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export class RejectDocumentDto {
  @IsEnum(
    [
      'blurry_document',
      'expired_document',
      'mismatch',
      'incomplete',
      'fraudulent',
      'wrong_document_type',
      'malware_detected',
      'other',
    ],
    { message: 'Invalid rejection reason code' }
  )
  reasonCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}
