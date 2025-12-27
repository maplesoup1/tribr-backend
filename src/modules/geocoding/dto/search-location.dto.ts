import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class SearchLocationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query: string;

  @IsOptional()
  @IsString()
  language?: string = 'en';
}

export class PlaceDetailsDto {
  @IsString()
  placeId: string;
}
