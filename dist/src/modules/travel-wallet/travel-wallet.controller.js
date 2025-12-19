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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TravelWalletController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const travel_wallet_service_1 = require("./travel-wallet.service");
const dto_1 = require("./dto");
let TravelWalletController = class TravelWalletController {
    travelWalletService;
    constructor(travelWalletService) {
        this.travelWalletService = travelWalletService;
    }
    async getWallet(req) {
        return this.travelWalletService.getDocumentsGrouped(req.user.id);
    }
    async getDocuments(req) {
        return this.travelWalletService.getDocuments(req.user.id);
    }
    async getExpiringDocuments(req) {
        return this.travelWalletService.getExpiringDocuments(req.user.id);
    }
    async getDocument(req, id) {
        return this.travelWalletService.getDocument(req.user.id, id);
    }
    async createDocument(req, dto) {
        return this.travelWalletService.createDocument(req.user.id, dto);
    }
    async updateDocument(req, id, dto) {
        return this.travelWalletService.updateDocument(req.user.id, id, dto);
    }
    async deleteDocument(req, id) {
        await this.travelWalletService.deleteDocument(req.user.id, id);
        return { message: 'Document deleted successfully' };
    }
    async uploadDocumentFile(req, id, file) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        return this.travelWalletService.uploadDocumentFile(req.user.id, id, file);
    }
};
exports.TravelWalletController = TravelWalletController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)('documents'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Get)('documents/expiring'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "getExpiringDocuments", null);
__decorate([
    (0, common_1.Get)('documents/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "getDocument", null);
__decorate([
    (0, common_1.Post)('documents'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateDocumentDto]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Patch)('documents/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "updateDocument", null);
__decorate([
    (0, common_1.Delete)('documents/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Post)('documents/:id/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TravelWalletController.prototype, "uploadDocumentFile", null);
exports.TravelWalletController = TravelWalletController = __decorate([
    (0, common_1.Controller)('travel-wallet'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [travel_wallet_service_1.TravelWalletService])
], TravelWalletController);
//# sourceMappingURL=travel-wallet.controller.js.map