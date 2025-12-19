import { TravelWalletService, DocumentWithStatus, GroupedDocuments } from './travel-wallet.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
export declare class TravelWalletController {
    private readonly travelWalletService;
    constructor(travelWalletService: TravelWalletService);
    getWallet(req: any): Promise<GroupedDocuments>;
    getDocuments(req: any): Promise<DocumentWithStatus[]>;
    getExpiringDocuments(req: any): Promise<DocumentWithStatus[]>;
    getDocument(req: any, id: string): Promise<DocumentWithStatus>;
    createDocument(req: any, dto: CreateDocumentDto): Promise<DocumentWithStatus>;
    updateDocument(req: any, id: string, dto: UpdateDocumentDto): Promise<DocumentWithStatus>;
    deleteDocument(req: any, id: string): Promise<{
        message: string;
    }>;
    uploadDocumentFile(req: any, id: string, file: Express.Multer.File): Promise<DocumentWithStatus>;
}
