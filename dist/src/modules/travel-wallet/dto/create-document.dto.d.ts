import { DocumentType } from '@prisma/client';
export declare class CreateDocumentDto {
    documentType: DocumentType;
    title: string;
    subtitle?: string;
    expirationDate?: string;
    metadata?: Record<string, any>;
}
