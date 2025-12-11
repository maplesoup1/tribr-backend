import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class NearbyQueryDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => Number(value))
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => Number(value))
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5000)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 50))
  radiusKm?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  limit?: number = 20;
}
