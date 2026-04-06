import { IsEnum, IsOptional, IsString, ValidateNested, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class BankDetailsDto {
  @IsEnum(
    [
      'CBE',
      'Awash Bank',
      'Dashen Bank',
      'Bank of Abyssinia',
      'Wegagen Bank',
      'United Bank',
      'Nib International Bank',
      'Zemen Bank',
      'Cooperative Bank of Oromia',
      'Abay Bank',
      'Berhan Bank',
      'Bunna International Bank',
    ],
    { message: 'Invalid bank name' }
  )
  bankName!: string;

  @IsString({ message: 'Account number must be a string' })
  accountNumber!: string;

  @IsString({ message: 'Account holder name must be a string' })
  accountHolderName!: string;
}

export class UpdatePaymentSettingsDto {
  @IsOptional()
  @IsEnum(['chapa', 'telebirr', 'santimpay', 'bank_transfer'], {
    message: 'Preferred payment method must be one of: chapa, telebirr, santimpay, bank_transfer',
  })
  preferredPaymentMethod?: 'chapa' | 'telebirr' | 'santimpay' | 'bank_transfer';

  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsString({ message: 'Payment instructions must be a string' })
  @MaxLength(1000, { message: 'Payment instructions cannot exceed 1000 characters' })
  paymentInstructions?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
