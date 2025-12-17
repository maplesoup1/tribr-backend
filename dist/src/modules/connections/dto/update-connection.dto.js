"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateConnectionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_connection_dto_1 = require("./create-connection.dto");
class UpdateConnectionDto extends (0, swagger_1.PartialType)(create_connection_dto_1.CreateConnectionDto) {
}
exports.UpdateConnectionDto = UpdateConnectionDto;
//# sourceMappingURL=update-connection.dto.js.map