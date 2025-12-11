import { SupabaseService } from '../../supabase/supabase.service';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly supabaseService;
    private readonly usersService;
    constructor(supabaseService: SupabaseService, usersService: UsersService);
    signUpWithOtp(signUpDto: SignUpDto): Promise<{
        message: string;
        email: string;
        userId: string | undefined;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        user: import("@supabase/supabase-js").AuthUser;
        session: import("@supabase/supabase-js").AuthSession | null;
        accessToken: string | undefined;
        refreshToken: string | undefined;
    }>;
    resendOtp(email: string): Promise<{
        message: string;
        email: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        user: import("@supabase/supabase-js").AuthUser;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
