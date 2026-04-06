import { IsBoolean } from 'class-validator';

export class RespondToOfferDto {
  @IsBoolean({ message: 'Accept must be a boolean value' })
  accept!: boolean;
}
