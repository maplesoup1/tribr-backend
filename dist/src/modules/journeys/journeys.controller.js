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
exports.JourneysController = void 0;
const common_1 = require("@nestjs/common");
const journeys_service_1 = require("./journeys.service");
const create_journey_dto_1 = require("./dto/create-journey.dto");
const update_journey_dto_1 = require("./dto/update-journey.dto");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const users_service_1 = require("../users/users.service");
let JourneysController = class JourneysController {
    journeysService;
    usersService;
    constructor(journeysService, usersService) {
        this.journeysService = journeysService;
        this.usersService = usersService;
    }
    async create(req, dto) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.journeysService.create(currentUser.id, dto);
    }
    async findAll(req, scope, take, skip) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.journeysService.findVisibleForUser(currentUser.id, scope, take ? +take : 20, skip ? +skip : 0);
    }
    async findOne(id, req) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.journeysService.findOne(id, currentUser.id);
    }
    async update(id, dto, req) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.journeysService.update(id, dto, currentUser.id);
    }
    async remove(id, req) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.journeysService.remove(id, currentUser.id);
    }
};
exports.JourneysController = JourneysController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_journey_dto_1.CreateJourneyDto]),
    __metadata("design:returntype", Promise)
], JourneysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('scope')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], JourneysController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JourneysController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_journey_dto_1.UpdateJourneyDto, Object]),
    __metadata("design:returntype", Promise)
], JourneysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JourneysController.prototype, "remove", null);
exports.JourneysController = JourneysController = __decorate([
    (0, common_1.Controller)('journeys'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [journeys_service_1.JourneysService,
        users_service_1.UsersService])
], JourneysController);
//# sourceMappingURL=journeys.controller.js.map