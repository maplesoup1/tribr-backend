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
exports.TravelWalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const supabase_service_1 = require("../../supabase/supabase.service");
const client_1 = require("@prisma/client");
let TravelWalletService = class TravelWalletService {
    prisma;
    supabaseService;
    constructor(prisma, supabaseService) {
        this.prisma = prisma;
        this.supabaseService = supabaseService;
    }
    async getDocuments(userId) {
        const documents = await this.prisma.walletDocument.findMany({
            where: { userId },
            orderBy: { expirationDate: 'asc' },
        });
        return documents.map((doc) => this.addStatusToDocument(doc));
    }
    async getDocumentsGrouped(userId) {
        const documents = await this.getDocuments(userId);
        const travelDocTypes = [
            client_1.DocumentType.passport,
            client_1.DocumentType.drivers_license,
            client_1.DocumentType.national_id,
        ];
        const visaDocTypes = [
            client_1.DocumentType.visa,
            client_1.DocumentType.work_permit,
        ];
        const insuranceDocTypes = [
            client_1.DocumentType.travel_insurance,
            client_1.DocumentType.health_insurance,
        ];
        return {
            travelDocuments: documents.filter((d) => travelDocTypes.includes(d.documentType)),
            visasAndPermits: documents.filter((d) => visaDocTypes.includes(d.documentType)),
            insurance: documents.filter((d) => insuranceDocTypes.includes(d.documentType)),
            healthRecords: documents.filter((d) => d.documentType === client_1.DocumentType.vaccination_record),
        };
    }
    async getDocument(userId, documentId) {
        const document = await this.prisma.walletDocument.findUnique({
            where: { id: documentId },
        });
        if (!document) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (document.userId !== userId) {
            throw new common_1.ForbiddenException('Cannot access this document');
        }
        return this.addStatusToDocument(document);
    }
    async createDocument(userId, dto) {
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
    async updateDocument(userId, documentId, dto) {
        const existing = await this.prisma.walletDocument.findUnique({
            where: { id: documentId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (existing.userId !== userId) {
            throw new common_1.ForbiddenException('Cannot update this document');
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
    async deleteDocument(userId, documentId) {
        const existing = await this.prisma.walletDocument.findUnique({
            where: { id: documentId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (existing.userId !== userId) {
            throw new common_1.ForbiddenException('Cannot delete this document');
        }
        if (existing.documentUrl) {
            await this.deleteDocumentFile(existing.documentUrl);
        }
        await this.prisma.walletDocument.delete({
            where: { id: documentId },
        });
    }
    async uploadDocumentFile(userId, documentId, file) {
        const existing = await this.prisma.walletDocument.findUnique({
            where: { id: documentId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Document not found');
        }
        if (existing.userId !== userId) {
            throw new common_1.ForbiddenException('Cannot upload to this document');
        }
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Only PDF and images are allowed');
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException('File size must be less than 10MB');
        }
        if (existing.documentUrl) {
            await this.deleteDocumentFile(existing.documentUrl);
        }
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
            throw new common_1.InternalServerErrorException('Failed to upload document file');
        }
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
        const document = await this.prisma.walletDocument.update({
            where: { id: documentId },
            data: { documentUrl: urlData.publicUrl },
        });
        return this.addStatusToDocument(document);
    }
    async getExpiringDocuments(userId) {
        const documents = await this.getDocuments(userId);
        return documents.filter((doc) => doc.daysUntilExpiry !== null &&
            doc.daysUntilExpiry > 0 &&
            doc.daysUntilExpiry <= 90);
    }
    addStatusToDocument(doc) {
        const daysUntilExpiry = this.calculateDaysUntilExpiry(doc.expirationDate);
        const status = this.calculateStatus(daysUntilExpiry);
        return {
            ...doc,
            status,
            daysUntilExpiry,
        };
    }
    calculateDaysUntilExpiry(expirationDate) {
        if (!expirationDate)
            return null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const expiry = new Date(expirationDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    calculateStatus(daysUntilExpiry) {
        if (daysUntilExpiry === null)
            return 'valid';
        if (daysUntilExpiry < 0)
            return 'expired';
        if (daysUntilExpiry <= 90)
            return 'expiring_soon';
        return 'valid';
    }
    async deleteDocumentFile(fileUrl) {
        try {
            const supabase = this.supabaseService.getClient();
            const bucketName = 'wallet-documents';
            const urlParts = fileUrl.split(`${bucketName}/`);
            if (urlParts.length < 2)
                return;
            const filePath = urlParts[1];
            await supabase.storage.from(bucketName).remove([filePath]);
        }
        catch (error) {
            console.error('Failed to delete document file:', error);
        }
    }
};
exports.TravelWalletService = TravelWalletService;
exports.TravelWalletService = TravelWalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_service_1.SupabaseService])
], TravelWalletService);
//# sourceMappingURL=travel-wallet.service.js.map