import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private configService;
    private supabase;
    private anonClient;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private ensureStorageBuckets;
    getClient(): SupabaseClient;
    getAnonClient(): SupabaseClient;
    verifyToken(token: string): Promise<import("@supabase/supabase-js").AuthUser>;
}
