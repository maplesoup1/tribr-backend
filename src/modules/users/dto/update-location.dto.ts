import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Visibility } from '@prisma/client';

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsEnum(Visibility)
  privacy?: Visibility;
}
