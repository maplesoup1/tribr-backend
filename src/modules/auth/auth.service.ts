import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async signUpWithOtp(signUpDto: SignUpDto) {
    const { email, password, fullName, phone } = signUpDto;

    try {
      // Create user with Supabase Auth
      const { data, error } = await this.supabaseService.getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
          emailRedirectTo: undefined, // Disable magic link
        },
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      // Send OTP to email
      const { error: otpError } = await this.supabaseService.getClient().auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // User already created
        },
      });

      if (otpError) {
        throw new BadRequestException(otpError.message);
      }

      return {
        message: 'OTP sent to your email. Please verify to complete registration.',
        email,
        userId: data.user?.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create account. Please try again.');
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, token } = verifyOtpDto;

    try {
      const { data, error } = await this.supabaseService.getClient().auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        throw new UnauthorizedException('Invalid or expired OTP code');
      }

      if (!data.user) {
        throw new UnauthorizedException('Verification failed');
      }

      return {
        message: 'Email verified successfully',
        user: data.user,
        session: data.session,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify OTP. Please try again.');
    }
  }

  async resendOtp(email: string) {
    try {
      const { error } = await this.supabaseService.getClient().auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw new BadRequestException(error.message);
      }

      return {
        message: 'New OTP sent to your email',
        email,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to resend OTP. Please try again.');
    }
  }
}
