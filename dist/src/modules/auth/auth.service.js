"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let AuthService = class AuthService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async signUpWithOtp(signUpDto) {
        const { email, fullName } = signUpDto;
        try {
            const { data, error } = await this.supabaseService
                .getClient()
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
                throw new common_1.BadRequestException(error.message);
            }
            return {
                message: 'OTP sent to your email. Please verify to complete registration.',
                email,
                userId: data.user?.id,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to create account. Please try again.');
        }
    }
    async verifyOtp(verifyOtpDto) {
        const { email, token } = verifyOtpDto;
        try {
            const { data, error } = await this.supabaseService
                .getClient()
                .auth.verifyOtp({
                email,
                token,
                type: 'email',
            });
            if (error) {
                throw new common_1.UnauthorizedException('Invalid or expired OTP code');
            }
            if (!data.user) {
                throw new common_1.UnauthorizedException('Verification failed');
            }
            return {
                message: 'Email verified successfully',
                user: data.user,
                session: data.session,
                accessToken: data.session?.access_token,
                refreshToken: data.session?.refresh_token,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to verify OTP. Please try again.');
        }
    }
    async resendOtp(email) {
        try {
            const { error } = await this.supabaseService
                .getClient()
                .auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false,
                },
            });
            if (error) {
                throw new common_1.BadRequestException(error.message);
            }
            return {
                message: 'New OTP sent to your email',
                email,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to resend OTP. Please try again.');
        }
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        try {
            const { data, error } = await this.supabaseService
                .getClient()
                .auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                throw new common_1.UnauthorizedException(error.message);
            }
            if (!data.user || !data.session) {
                throw new common_1.UnauthorizedException('Login failed');
            }
            return {
                message: 'Login successful',
                user: data.user,
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
            };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.BadRequestException('Failed to login. Please try again.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map