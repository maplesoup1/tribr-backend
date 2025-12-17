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
exports.ConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const connections_service_1 = require("./connections.service");
const create_connection_dto_1 = require("./dto/create-connection.dto");
const update_connection_dto_1 = require("./dto/update-connection.dto");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const client_1 = require("@prisma/client");
const users_service_1 = require("../users/users.service");
let ConnectionsController = class ConnectionsController {
    connectionsService;
    usersService;
    constructor(connectionsService, usersService) {
        this.connectionsService = connectionsService;
        this.usersService = usersService;
    }
    async create(req, dto) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.connectionsService.create(currentUser.id, dto);
    }
    async findAll(req, status, take, skip) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.connectionsService.listByUser(currentUser.id, status, take ? +take : 50, skip ? +skip : 0);
    }
    async update(id, req, dto) {
        if (!dto.status) {
            throw new common_1.BadRequestException('status field is required');
        }
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.connectionsService.updateStatus(id, dto.status, currentUser.id);
    }
    async remove(id, req) {
        const currentUser = await this.usersService.getOrCreateFromSupabaseUser(req.user);
        return this.connectionsService.remove(id, currentUser.id);
    }
};
exports.ConnectionsController = ConnectionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_connection_dto_1.CreateConnectionDto]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('take')),
    __param(3, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_connection_dto_1.UpdateConnectionDto]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "remove", null);
exports.ConnectionsController = ConnectionsController = __decorate([
    (0, common_1.Controller)('connections'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [connections_service_1.ConnectionsService,
        users_service_1.UsersService])
], ConnectionsController);
//# sourceMappingURL=connections.controller.js.map