"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../../modules/users/users.service");
exports.CurrentUser = (0, common_1.createParamDecorator)(async (data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.currentUser) {
        return request.currentUser;
    }
    if (request.user) {
        const usersService = request.app.get(users_service_1.UsersService);
        request.currentUser = await usersService.getOrCreateFromSupabaseUser(request.user);
        return request.currentUser;
    }
    return null;
});
//# sourceMappingURL=current-user.decorator.js.map