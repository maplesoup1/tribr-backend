import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    health(): Promise<{
        status: string;
        timestamp: string;
        database: string;
        uptime: number;
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        database: string;
        error: string;
        uptime?: undefined;
    }>;
    ready(): {
        status: string;
        timestamp: string;
    };
    live(): {
        status: string;
        timestamp: string;
    };
}
