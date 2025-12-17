"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJourneyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_journey_dto_1 = require("./create-journey.dto");
class UpdateJourneyDto extends (0, swagger_1.PartialType)(create_journey_dto_1.CreateJourneyDto) {
}
exports.UpdateJourneyDto = UpdateJourneyDto;
//# sourceMappingURL=update-journey.dto.js.map