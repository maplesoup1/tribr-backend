import { ConfigService } from '@nestjs/config';
export interface GeocodingResult {
    placeId: string;
    name: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    countryCode?: string;
}
export interface AutocompleteResult {
    placeId: string;
    mainText: string;
    secondaryText: string;
    description: string;
}
export declare class GeocodingService {
    private readonly configService;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    autocomplete(query: string, language?: string): Promise<AutocompleteResult[]>;
    getPlaceDetails(placeId: string): Promise<GeocodingResult>;
    geocode(address: string, language?: string): Promise<GeocodingResult[]>;
    reverseGeocode(latitude: number, longitude: number, language?: string): Promise<GeocodingResult | null>;
}
