import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signUp(signUpDto: SignUpDto): Promise<{
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
    resendOtp(dto: ResendOtpDto): Promise<{
        message: string;
        email: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        user: import("@supabase/auth-js").User;
        accessToken: string;
        refreshToken: string;
    }>;
}
