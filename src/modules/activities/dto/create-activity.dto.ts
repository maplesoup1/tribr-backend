import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ActivityTimeType, ActivityPrivacy } from '@prisma/client';

export class CreateActivityDto {
  @IsOptional()
  @IsString()
  emoji?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  date: string; // ISO Date "YYYY-MM-DD"

  @IsEnum(ActivityTimeType)
  timeType: ActivityTimeType;

  @ValidateIf((o) => o.timeType === ActivityTimeType.specific)
  @IsNotEmpty()
  @IsString() // Time string e.g. "14:30" or ISO
  specificTime?: string;

  @IsNotEmpty()
  @IsString()
  locationText: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsEnum(ActivityPrivacy)
  privacy: ActivityPrivacy;

  @IsOptional()
  @IsBoolean()
  womenOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  @Transform(({ value }) => parseInt(value))
  ageMin?: number = 18;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(120)
  @Transform(({ value }) => parseInt(value))
  ageMax?: number = 99;
}
