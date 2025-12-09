import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class SignUpDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // Email-only OTP: optional phone/password
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
