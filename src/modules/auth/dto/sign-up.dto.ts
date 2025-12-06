import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
