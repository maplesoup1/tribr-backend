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
let BadgesController = class BadgesController {
    badgesService;
    usersService;
    constructor(badgesService, usersService) {
        this.badgesService = badgesService;
        this.usersService = usersService;
    }
    async findAll() {
        return this.badgesService.findAll();
    }
    async getMyBadges(req) {
        const user = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.badgesService.getUserBadges(user.id);
    }
    async seedBadges() {
        return this.badgesService.seedDefaultBadges();
    }
};
exports.BadgesController = BadgesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "getMyBadges", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BadgesController.prototype, "seedBadges", null);
exports.BadgesController = BadgesController = __decorate([
    (0, common_1.Controller)('badges'),
    __metadata("design:paramtypes", [badges_service_1.BadgesService,
        users_service_1.UsersService])
], BadgesController);
//# sourceMappingURL=badges.controller.js.map