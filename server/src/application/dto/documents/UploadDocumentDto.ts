import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { DocumentTypeV2 } from '../../../models/TenantDocument.js';

export class UploadDocumentDto {
  @IsEnum(
    [
      'agreement',
      'national_id',
      'passport',
      'proof_of_address',
      'proof_of_income',
      'guarantor_id',
      'selfie',
      'power_of_attorney',
      'business_registration',
      'lease_amendment',
      'lease_renewal',
      'other',
    ],
    { message: 'Invalid document type' }
  )
  type!: DocumentTypeV2;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() @MaxLength(50) documentNumber?: string;
  @IsOptional() @IsString() @MaxLength(100) issuingCountry?: string;
}
