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
exports.BadgesController = void 0;
const common_1 = require("@nestjs/common");
const badges_service_1 = require("./badges.service");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const users_service_1 = require("../users/users.service");
const client_1 = require("@prisma/client");
let BadgesController = class BadgesController {
    badgesService;
    usersService;
    constructor(badgesService, usersService) {
        this.badgesService = badgesService;
        this.usersService = usersService;
    }
    async findAll(category) {
        return this.badgesService.findAll(category);
    }
    async getStats() {
        return this.badgesService.getStats();
    }
    async getMyBadges(req) {
        const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.badgesService.getUserBadges(user.id);
    }
    async getMyBadgeStats(req) {
        const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.badgesService.getUserBadgeStats(user.id);
    }
    async getAllWithMyProgress(req, category) {
        const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.badgesService.getAllBadgesWithUserProgress(user.id, category);
    }
    async seedBadges() {
        return this.badgesService.seedDefaultBadges();
    }
    async updateProgress(req, code, progress) {
        const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.badgesService.updateProgress(user.id, code, progress);
    }
};
exports.BadgesController = BadgesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getMyBadges", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getMyBadgeStats", null);
__decorate([
    (0, common_1.Get)('me/all'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getAllWithMyProgress", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "seedBadges", null);
__decorate([
    (0, common_1.Post)(':code/progress'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Body)('progress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "updateProgress", null);
exports.BadgesController = BadgesController = __decorate([
    (0, common_1.Controller)('badges'),
    __metadata("design:paramtypes", [badges_service_1.BadgesService,
        users_service_1.UsersService])
], BadgesController);
//# sourceMappingURL=badges.controller.js.map