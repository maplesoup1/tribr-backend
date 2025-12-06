import { SupabaseService } from '../../supabase/supabase.service';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class AuthService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    signUpWithOtp(signUpDto: SignUpDto): Promise<{
        message: string;
        email: string;
        userId: string | undefined;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session | null;
        accessToken: string | undefined;
        refreshToken: string | undefined;
    }>;
    resendOtp(email: string): Promise<{
        message: string;
        email: string;
    }>;
}
