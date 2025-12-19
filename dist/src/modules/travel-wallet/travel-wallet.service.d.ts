import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { WalletDocument } from '@prisma/client';
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
export declare class TravelWalletService {
    private readonly prisma;
    private readonly supabaseService;
    constructor(prisma: PrismaService, supabaseService: SupabaseService);
    getDocuments(userId: string): Promise<DocumentWithStatus[]>;
    getDocumentsGrouped(userId: string): Promise<GroupedDocuments>;
    getDocument(userId: string, documentId: string): Promise<DocumentWithStatus>;
    createDocument(userId: string, dto: CreateDocumentDto): Promise<DocumentWithStatus>;
    updateDocument(userId: string, documentId: string, dto: UpdateDocumentDto): Promise<DocumentWithStatus>;
    deleteDocument(userId: string, documentId: string): Promise<void>;
    uploadDocumentFile(userId: string, documentId: string, file: Express.Multer.File): Promise<DocumentWithStatus>;
    getExpiringDocuments(userId: string): Promise<DocumentWithStatus[]>;
    private addStatusToDocument;
    private calculateDaysUntilExpiry;
    private calculateStatus;
    private deleteDocumentFile;
}
