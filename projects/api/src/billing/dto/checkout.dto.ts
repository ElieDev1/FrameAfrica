import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CheckoutDto {
  @IsString()
  @MaxLength(64)
  planCode!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  /** Required for mobile money — the handset that receives the prompt. */
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Enter a valid phone number.' })
  phone?: string;
}
