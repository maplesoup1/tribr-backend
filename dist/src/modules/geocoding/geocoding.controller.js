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
exports.GeocodingController = void 0;
const common_1 = require("@nestjs/common");
const geocoding_service_1 = require("./geocoding.service");
const search_location_dto_1 = require("./dto/search-location.dto");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
let GeocodingController = class GeocodingController {
    geocodingService;
    constructor(geocodingService) {
        this.geocodingService = geocodingService;
    }
    async autocomplete(dto) {
        return this.geocodingService.autocomplete(dto.query, dto.language);
    }
    async getPlaceDetails(dto) {
        return this.geocodingService.getPlaceDetails(dto.placeId);
    }
    async search(dto) {
        return this.geocodingService.geocode(dto.query, dto.language);
    }
    async reverse(latitude, longitude, language) {
        return this.geocodingService.reverseGeocode(parseFloat(latitude), parseFloat(longitude), language || 'en');
    }
};
exports.GeocodingController = GeocodingController;
__decorate([
    (0, common_1.Get)('autocomplete'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_location_dto_1.SearchLocationDto]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "autocomplete", null);
__decorate([
    (0, common_1.Get)('place'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_location_dto_1.PlaceDetailsDto]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "getPlaceDetails", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_location_dto_1.SearchLocationDto]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('reverse'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GeocodingController.prototype, "reverse", null);
exports.GeocodingController = GeocodingController = __decorate([
    (0, common_1.Controller)('geocoding'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [geocoding_service_1.GeocodingService])
], GeocodingController);
//# sourceMappingURL=geocoding.controller.js.map