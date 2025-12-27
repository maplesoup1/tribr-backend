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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GeocodingService = class GeocodingService {
    configService;
    apiKey;
    baseUrl = 'https://maps.googleapis.com/maps/api';
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('google.placesApiKey') || '';
        if (!this.apiKey) {
            console.warn('GOOGLE_PLACES_API_KEY is not configured');
        }
    }
    async autocomplete(query, language = 'en') {
        if (!this.apiKey) {
            throw new common_1.BadRequestException('Geocoding service is not configured');
        }
        const params = new URLSearchParams({
            input: query,
            types: '(cities)',
            language,
            key: this.apiKey,
        });
        const response = await fetch(`${this.baseUrl}/place/autocomplete/json?${params}`);
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch autocomplete results');
        }
        const data = await response.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API error:', data.status, data.error_message);
            throw new common_1.BadRequestException('Geocoding service error');
        }
        return (data.predictions || []).map((prediction) => ({
            placeId: prediction.place_id,
            mainText: prediction.structured_formatting?.main_text || prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text || '',
            description: prediction.description,
        }));
    }
    async getPlaceDetails(placeId) {
        if (!this.apiKey) {
            throw new common_1.BadRequestException('Geocoding service is not configured');
        }
        const params = new URLSearchParams({
            place_id: placeId,
            fields: 'place_id,name,formatted_address,geometry,address_components',
            key: this.apiKey,
        });
        const response = await fetch(`${this.baseUrl}/place/details/json?${params}`);
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to fetch place details');
        }
        const data = await response.json();
        if (data.status !== 'OK') {
            console.error('Google Places API error:', data.status, data.error_message);
            throw new common_1.BadRequestException('Place not found');
        }
        const result = data.result;
        const location = result.geometry?.location;
        let city;
        let country;
        let countryCode;
        for (const component of result.address_components || []) {
            if (component.types.includes('locality')) {
                city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1') && !city) {
                city = component.long_name;
            }
            if (component.types.includes('country')) {
                country = component.long_name;
                countryCode = component.short_name;
            }
        }
        return {
            placeId: result.place_id,
            name: result.name,
            formattedAddress: result.formatted_address,
            latitude: location?.lat,
            longitude: location?.lng,
            city,
            country,
            countryCode,
        };
    }
    async geocode(address, language = 'en') {
        if (!this.apiKey) {
            throw new common_1.BadRequestException('Geocoding service is not configured');
        }
        const params = new URLSearchParams({
            address,
            language,
            key: this.apiKey,
        });
        const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to geocode address');
        }
        const data = await response.json();
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Geocoding API error:', data.status, data.error_message);
            throw new common_1.BadRequestException('Geocoding service error');
        }
        return (data.results || []).map((result) => {
            const location = result.geometry?.location;
            let city;
            let country;
            let countryCode;
            for (const component of result.address_components || []) {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                }
                if (component.types.includes('administrative_area_level_1') && !city) {
                    city = component.long_name;
                }
                if (component.types.includes('country')) {
                    country = component.long_name;
                    countryCode = component.short_name;
                }
            }
            return {
                placeId: result.place_id,
                name: city || result.formatted_address.split(',')[0],
                formattedAddress: result.formatted_address,
                latitude: location?.lat,
                longitude: location?.lng,
                city,
                country,
                countryCode,
            };
        });
    }
    async reverseGeocode(latitude, longitude, language = 'en') {
        if (!this.apiKey) {
            throw new common_1.BadRequestException('Geocoding service is not configured');
        }
        const params = new URLSearchParams({
            latlng: `${latitude},${longitude}`,
            language,
            key: this.apiKey,
        });
        const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
        if (!response.ok) {
            throw new common_1.BadRequestException('Failed to reverse geocode');
        }
        const data = await response.json();
        if (data.status !== 'OK' || !data.results?.length) {
            return null;
        }
        const result = data.results[0];
        const location = result.geometry?.location;
        let city;
        let country;
        let countryCode;
        for (const component of result.address_components || []) {
            if (component.types.includes('locality')) {
                city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1') && !city) {
                city = component.long_name;
            }
            if (component.types.includes('country')) {
                country = component.long_name;
                countryCode = component.short_name;
            }
        }
        return {
            placeId: result.place_id,
            name: city || result.formatted_address.split(',')[0],
            formattedAddress: result.formatted_address,
            latitude: location?.lat || latitude,
            longitude: location?.lng || longitude,
            city,
            country,
            countryCode,
        };
    }
};
exports.GeocodingService = GeocodingService;
exports.GeocodingService = GeocodingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeocodingService);
//# sourceMappingURL=geocoding.service.js.map