import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import {
  TravelWalletService,
  DocumentWithStatus,
  GroupedDocuments,
} from './travel-wallet.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';

@Controller('travel-wallet')
@UseGuards(SupabaseAuthGuard)
export class TravelWalletController {
  constructor(private readonly travelWalletService: TravelWalletService) {}

  /**
   * GET /travel-wallet
   * Get all documents grouped by category
   */
  @Get()
  async getWallet(@Request() req): Promise<GroupedDocuments> {
    return this.travelWalletService.getDocumentsGrouped(req.user.id);
  }

  /**
   * GET /travel-wallet/documents
   * Get all documents as a flat list
   */
  @Get('documents')
  async getDocuments(@Request() req): Promise<DocumentWithStatus[]> {
    return this.travelWalletService.getDocuments(req.user.id);
  }

  /**
   * GET /travel-wallet/documents/expiring
   * Get documents expiring within 90 days
   */
  @Get('documents/expiring')
  async getExpiringDocuments(@Request() req): Promise<DocumentWithStatus[]> {
    return this.travelWalletService.getExpiringDocuments(req.user.id);
  }

  /**
   * GET /travel-wallet/documents/:id
   * Get a single document by ID
   */
  @Get('documents/:id')
  async getDocument(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentWithStatus> {
    return this.travelWalletService.getDocument(req.user.id, id);
  }

  /**
   * POST /travel-wallet/documents
   * Create a new document
   */
  @Post('documents')
  async createDocument(
    @Request() req,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentWithStatus> {
    return this.travelWalletService.createDocument(req.user.id, dto);
  }

  /**
   * PATCH /travel-wallet/documents/:id
   * Update an existing document
   */
  @Patch('documents/:id')
  async updateDocument(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentWithStatus> {
    return this.travelWalletService.updateDocument(req.user.id, id, dto);
  }

  /**
   * DELETE /travel-wallet/documents/:id
   * Delete a document
   */
  @Delete('documents/:id')
  async deleteDocument(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.travelWalletService.deleteDocument(req.user.id, id);
    return { message: 'Document deleted successfully' };
  }

  /**
   * POST /travel-wallet/documents/:id/upload
   * Upload a file for a document
   */
  @Post('documents/:id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentFile(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentWithStatus> {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.travelWalletService.uploadDocumentFile(req.user.id, id, file);
  }
}
