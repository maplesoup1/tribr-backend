import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AuthResponse } from '@supabase/supabase-js';
import { SupabaseService } from '../../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async signUpWithOtp(signUpDto: SignUpDto) {
    const { email, fullName } = signUpDto;

    try {
      // Check if user already exists
      const { data: existingUsers } = await this.supabaseService
        .getClient()
        .auth.admin.listUsers();

      const userExists = existingUsers?.users?.some(
        (user: any) => user.email?.toLowerCase() === email.toLowerCase(),
      );

      if (userExists) {
        throw new ConflictException('Email already registered');
      }

      // Email-only OTP flow: single call to signInWithOtp, create user if needed
      // Use anon client for user-facing auth operations
      const { data, error }: AuthResponse = await this.supabaseService
        .getAnonClient()
        .auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: {
              full_name: fullName,
            },
          },
        });

      if (error) {
        throw new BadRequestException(error.message);
      }

      return {
        message:
          'OTP sent to your email. Please verify to complete registration.',
        email,
        userId: data.user?.id,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create account. Please try again.',
      );
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, token } = verifyOtpDto;

    try {
      console.log(`[OTP Verify] Attempting verification for email: ${email}, token: ${token}`);

      // Use anon client for OTP verification (service role client doesn't work for this)
      // signInWithOtp sends magic_link type emails, so verify with 'magiclink'
      const { data, error } = await this.supabaseService
        .getAnonClient()
        .auth.verifyOtp({
          email,
          token,
          type: 'magiclink',
        });

      console.log(`[OTP Verify] Result - Error: ${error?.message}, User: ${data?.user?.id}`);
      console.log(`[OTP Verify] Session exists: ${!!data?.session}, AccessToken exists: ${!!data?.session?.access_token}`);

      if (error) {
        console.error(`[OTP Verify] Supabase error: ${JSON.stringify(error)}`);
        throw new UnauthorizedException(
          error.message || 'Invalid or expired OTP code',
        );
      }

      if (!data.user) {
        throw new UnauthorizedException('Verification failed');
      }

      // Ensure local user/profile exists
      try {
        console.log(`[OTP Verify] Creating/getting local user...`);
        await this.usersService.getOrCreateFromSupabaseUser(data.user);
        console.log(`[OTP Verify] Local user created/found successfully`);
      } catch (userError) {
        console.error(`[OTP Verify] Failed to create local user:`, userError);
        throw userError;
      }

      console.log(`[OTP Verify] Returning success response`);
      return {
        message: 'Email verified successfully',
        user: data.user,
        session: data.session,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      };
    } catch (error) {
      console.error(`[OTP Verify] Caught error:`, error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to verify OTP. Please try again.',
        detail: error instanceof Error ? error.message : error,
      });
    }
  }

  async resendOtp(email: string) {
    try {
      // Use anon client for user-facing auth operations
      const { error } = await this.supabaseService
        .getAnonClient()
        .auth.signInWithOtp({
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

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      // Use anon client for user-facing auth operations
      const { data, error } = await this.supabaseService
        .getAnonClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedException('Login failed');
      }

      // Ensure local user/profile exists
      await this.usersService.getOrCreateFromSupabaseUser(data.user);

      return {
        message: 'Login successful',
        user: data.user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to login. Please try again.');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Use anon client for user-facing auth operations
      const { data, error } = await this.supabaseService
        .getAnonClient()
        .auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to refresh token');
    }
  }
}
