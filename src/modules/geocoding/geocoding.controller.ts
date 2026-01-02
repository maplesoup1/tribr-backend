import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { SearchLocationDto, PlaceDetailsDto } from './dto/search-location.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('geocoding')
@UseGuards(FirebaseAuthGuard)
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  /**
   * Autocomplete search for cities/places
   * GET /geocoding/autocomplete?query=Tokyo&language=en
   */
  @Get('autocomplete')
  async autocomplete(@Query() dto: SearchLocationDto) {
    return this.geocodingService.autocomplete(dto.query, dto.language);
  }

  /**
   * Get place details (including coordinates) from place_id
   * GET /geocoding/place?placeId=ChIJ51cu8IcbXWARiRtXIothAS4
   */
  @Get('place')
  async getPlaceDetails(@Query() dto: PlaceDetailsDto) {
    return this.geocodingService.getPlaceDetails(dto.placeId);
  }

  /**
   * Direct geocoding: convert city/address name to coordinates
   * GET /geocoding/search?query=Tokyo
   */
  @Get('search')
  async search(@Query() dto: SearchLocationDto) {
    return this.geocodingService.geocode(dto.query, dto.language);
  }

  /**
   * Reverse geocoding: convert coordinates to location info
   * GET /geocoding/reverse?latitude=35.6762&longitude=139.6503
   */
  @Get('reverse')
  async reverse(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('language') language?: string,
  ) {
    return this.geocodingService.reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude),
      language || 'en',
    );
  }
}
