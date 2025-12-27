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
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = class SupabaseService {
    configService;
    supabase;
    anonClient;
    constructor(configService) {
        this.configService = configService;
        const supabaseUrl = this.configService.get('supabase.url');
        const supabaseKey = this.configService.get('supabase.serviceRoleKey');
        const anonKey = this.configService.get('supabase.anonKey');
        if (!supabaseUrl || !supabaseKey) {
            throw new common_1.InternalServerErrorException('Supabase URL and Service Role Key must be provided');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        if (anonKey) {
            this.anonClient = (0, supabase_js_1.createClient)(supabaseUrl, anonKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
        }
        else {
            this.anonClient = this.supabase;
        }
    }
    async onModuleInit() {
        await this.ensureStorageBuckets();
    }
    async ensureStorageBuckets() {
        const buckets = [
            {
                name: 'avatars',
                options: {
                    public: true,
                    fileSizeLimit: 5 * 1024 * 1024,
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                },
            },
            {
                name: 'profile-videos',
                options: {
                    public: true,
                    fileSizeLimit: 200 * 1024 * 1024,
                    allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
                },
            },
            {
                name: 'wallet-documents',
                options: {
                    public: true,
                    fileSizeLimit: 10 * 1024 * 1024,
                    allowedMimeTypes: [
                        'application/pdf',
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                    ],
                },
            },
        ];
        for (const bucket of buckets) {
            const { data: existingBucket } = await this.supabase.storage.getBucket(bucket.name);
            if (!existingBucket) {
                const { error } = await this.supabase.storage.createBucket(bucket.name, bucket.options);
                if (error && !error.message.includes('already exists')) {
                    console.error(`Failed to create bucket ${bucket.name}:`, error);
                }
                else {
                    console.log(`Storage bucket '${bucket.name}' ready`);
                }
            }
        }
    }
    getClient() {
        return this.supabase;
    }
    getAnonClient() {
        return this.anonClient;
    }
    async verifyToken(token) {
        const { data: { user }, error, } = await this.supabase.auth.getUser(token);
        if (error || !user) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        return user;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map