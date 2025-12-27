import { Injectable, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class GeocodingService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('google.placesApiKey') || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY is not configured');
    }
  }

  /**
   * Autocomplete search for places (cities, addresses, etc.)
   * Uses Google Places Autocomplete API
   */
  async autocomplete(
    query: string,
    language = 'en',
  ): Promise<AutocompleteResult[]> {
    if (!this.apiKey) {
      throw new BadRequestException('Geocoding service is not configured');
    }

    const params = new URLSearchParams({
      input: query,
      types: '(cities)', // Focus on cities for travel app
      language,
      key: this.apiKey,
    });

    const response = await fetch(
      `${this.baseUrl}/place/autocomplete/json?${params}`,
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch autocomplete results');
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new BadRequestException('Geocoding service error');
    }

    return (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
      description: prediction.description,
    }));
  }

  /**
   * Get place details including coordinates from place_id
   * Uses Google Places Details API
   */
  async getPlaceDetails(placeId: string): Promise<GeocodingResult> {
    if (!this.apiKey) {
      throw new BadRequestException('Geocoding service is not configured');
    }

    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'place_id,name,formatted_address,geometry,address_components',
      key: this.apiKey,
    });

    const response = await fetch(
      `${this.baseUrl}/place/details/json?${params}`,
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch place details');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new BadRequestException('Place not found');
    }

    const result = data.result;
    const location = result.geometry?.location;

    // Extract city and country from address components
    let city: string | undefined;
    let country: string | undefined;
    let countryCode: string | undefined;

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

  /**
   * Direct geocoding: convert address/city name to coordinates
   * Uses Google Geocoding API
   */
  async geocode(address: string, language = 'en'): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      throw new BadRequestException('Geocoding service is not configured');
    }

    const params = new URLSearchParams({
      address,
      language,
      key: this.apiKey,
    });

    const response = await fetch(
      `${this.baseUrl}/geocode/json?${params}`,
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to geocode address');
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Geocoding API error:', data.status, data.error_message);
      throw new BadRequestException('Geocoding service error');
    }

    return (data.results || []).map((result: any) => {
      const location = result.geometry?.location;

      let city: string | undefined;
      let country: string | undefined;
      let countryCode: string | undefined;

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

  /**
   * Reverse geocoding: convert coordinates to address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    language = 'en',
  ): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      throw new BadRequestException('Geocoding service is not configured');
    }

    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      language,
      key: this.apiKey,
    });

    const response = await fetch(
      `${this.baseUrl}/geocode/json?${params}`,
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to reverse geocode');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.length) {
      return null;
    }

    const result = data.results[0];
    const location = result.geometry?.location;

    let city: string | undefined;
    let country: string | undefined;
    let countryCode: string | undefined;

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
}
