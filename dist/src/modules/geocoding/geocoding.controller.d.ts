import { GeocodingService } from './geocoding.service';
import { SearchLocationDto, PlaceDetailsDto } from './dto/search-location.dto';
export declare class GeocodingController {
    private readonly geocodingService;
    constructor(geocodingService: GeocodingService);
    autocomplete(dto: SearchLocationDto): Promise<import("./geocoding.service").AutocompleteResult[]>;
    getPlaceDetails(dto: PlaceDetailsDto): Promise<import("./geocoding.service").GeocodingResult>;
    search(dto: SearchLocationDto): Promise<import("./geocoding.service").GeocodingResult[]>;
    reverse(latitude: string, longitude: string, language?: string): Promise<import("./geocoding.service").GeocodingResult | null>;
}
