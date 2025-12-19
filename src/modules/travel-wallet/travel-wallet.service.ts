import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { DocumentType, WalletDocument } from '@prisma/client';

export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired';

export interface DocumentWithStatus extends WalletDocument {
  status: DocumentStatus;
  daysUntilExpiry: number | null;
}

export interface GroupedDocuments {
  travelDocuments: DocumentWithStatus[];
  visasAndPermits: DocumentWithStatus[];
  insurance: DocumentWithStatus[];
  healthRecords: DocumentWithStatus[];
}

@Injectable()
export class TravelWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * Get all documents for a user, with computed status
   */
  async getDocuments(userId: string): Promise<DocumentWithStatus[]> {
    const documents = await this.prisma.walletDocument.findMany({
      where: { userId },
      orderBy: { expirationDate: 'asc' },
    });

    return documents.map((doc) => this.addStatusToDocument(doc));
  }

  /**
   * Get documents grouped by category (for the UI sections)
   */
  async getDocumentsGrouped(userId: string): Promise<GroupedDocuments> {
    const documents = await this.getDocuments(userId);

    const travelDocTypes: DocumentType[] = [
      DocumentType.passport,
      DocumentType.drivers_license,
      DocumentType.national_id,
    ];
    const visaDocTypes: DocumentType[] = [
      DocumentType.visa,
      DocumentType.work_permit,
    ];
    const insuranceDocTypes: DocumentType[] = [
      DocumentType.travel_insurance,
      DocumentType.health_insurance,
    ];

    return {
      travelDocuments: documents.filter((d) =>
        travelDocTypes.includes(d.documentType),
      ),
      visasAndPermits: documents.filter((d) =>
        visaDocTypes.includes(d.documentType),
      ),
      insurance: documents.filter((d) =>
        insuranceDocTypes.includes(d.documentType),
      ),
      healthRecords: documents.filter(
        (d) => d.documentType === DocumentType.vaccination_record,
      ),
    };
  }

  /**
   * Get a single document by ID
   */
  async getDocument(
    userId: string,
    documentId: string,
  ): Promise<DocumentWithStatus> {
    const document = await this.prisma.walletDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.userId !== userId) {
      throw new ForbiddenException('Cannot access this document');
    }

    return this.addStatusToDocument(document);
  }

  /**
   * Create a new document
   */
  async createDocument(
    userId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentWithStatus> {
    const document = await this.prisma.walletDocument.create({
      data: {
        userId,
        documentType: dto.documentType,
        title: dto.title,
        subtitle: dto.subtitle,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : null,
        metadata: dto.metadata ?? undefined,
      },
    });

    return this.addStatusToDocument(document);
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    userId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentWithStatus> {
    // Verify ownership
    const existing = await this.prisma.walletDocument.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot update this document');
    }

    const document = await this.prisma.walletDocument.update({
      where: { id: documentId },
      data: {
        ...(dto.documentType && { documentType: dto.documentType }),
        ...(dto.title && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.expirationDate !== undefined && {
          expirationDate: dto.expirationDate
            ? new Date(dto.expirationDate)
            : null,
        }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    });

    return this.addStatusToDocument(document);
  }

  /**
   * Delete a document
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    // Verify ownership
    const existing = await this.prisma.walletDocument.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot delete this document');
    }

    // Delete file from storage if exists
    if (existing.documentUrl) {
      await this.deleteDocumentFile(existing.documentUrl);
    }

    await this.prisma.walletDocument.delete({
      where: { id: documentId },
    });
  }

  /**
   * Upload a document file
   */
  async uploadDocumentFile(
    userId: string,
    documentId: string,
    file: Express.Multer.File,
  ): Promise<DocumentWithStatus> {
    // Verify ownership
    const existing = await this.prisma.walletDocument.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot upload to this document');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and images are allowed');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Delete existing file if any
    if (existing.documentUrl) {
      await this.deleteDocumentFile(existing.documentUrl);
    }

    // Upload to Supabase Storage
    const supabase = this.supabaseService.getClient();
    const bucketName = 'wallet-documents';
    const fileExt = file.originalname.split('.').pop() || 'pdf';
    const fileName = `${userId}/${documentId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new InternalServerErrorException('Failed to upload document file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Update document with file URL
    const document = await this.prisma.walletDocument.update({
      where: { id: documentId },
      data: { documentUrl: urlData.publicUrl },
    });

    return this.addStatusToDocument(document);
  }

  /**
   * Get documents that are expiring soon (within 90 days)
   */
  async getExpiringDocuments(userId: string): Promise<DocumentWithStatus[]> {
    const documents = await this.getDocuments(userId);

    return documents.filter(
      (doc) =>
        doc.daysUntilExpiry !== null &&
        doc.daysUntilExpiry > 0 &&
        doc.daysUntilExpiry <= 90,
    );
  }

  /**
   * Helper: Add status and days until expiry to a document
   */
  private addStatusToDocument(doc: WalletDocument): DocumentWithStatus {
    const daysUntilExpiry = this.calculateDaysUntilExpiry(doc.expirationDate);
    const status = this.calculateStatus(daysUntilExpiry);

    return {
      ...doc,
      status,
      daysUntilExpiry,
    };
  }

  /**
   * Helper: Calculate days until expiration
   */
  private calculateDaysUntilExpiry(expirationDate: Date | null): number | null {
    if (!expirationDate) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Calculate status based on days until expiry
   */
  private calculateStatus(daysUntilExpiry: number | null): DocumentStatus {
    if (daysUntilExpiry === null) return 'valid';
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 90) return 'expiring_soon';
    return 'valid';
  }

  /**
   * Helper: Delete file from Supabase Storage
   */
  private async deleteDocumentFile(fileUrl: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();
      const bucketName = 'wallet-documents';

      // Extract file path from URL
      const urlParts = fileUrl.split(`${bucketName}/`);
      if (urlParts.length < 2) return;

      const filePath = urlParts[1];
      await supabase.storage.from(bucketName).remove([filePath]);
    } catch (error) {
      console.error('Failed to delete document file:', error);
      // Don't throw - file deletion failure shouldn't block document deletion
    }
  }
}
