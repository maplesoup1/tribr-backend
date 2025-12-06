import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Health check endpoint for load balancers and monitoring
   * Verifies database connectivity
   */
  @Get('health')
  async health() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Readiness probe - checks if application is ready to serve traffic
   */
  @Get('health/ready')
  ready() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness probe - checks if application is alive
   */
  @Get('health/live')
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
