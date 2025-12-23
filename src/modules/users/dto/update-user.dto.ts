import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  ArrayMaxSize,
  IsEmail,
  IsUrl,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsEnum, ValidateNested } from 'class-validator';

export enum LanguageLevel {
  native = 'native',
  fluent = 'fluent',
  conversational = 'conversational',
  basic = 'basic',
}

export class LanguageDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  language!: string;

  @IsEnum(LanguageLevel)
  level!: LanguageLevel;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsUrl(
    {
      protocols: ['https'],
      require_protocol: true,
      require_valid_protocol: true,
    },
    { message: 'Photo URL must be a valid HTTPS URL' },
  )
  @MaxLength(2048)
  @Matches(/^https:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, {
    message: 'Photo URL must be a valid HTTPS URL',
  })
  photoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9\s-]+$/, {
    each: true,
    message: 'Archetypes can only contain letters, numbers, spaces and hyphens',
  })
  archetypes?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9\s-]+$/, {
    each: true,
    message: 'Interests can only contain letters, numbers, spaces and hyphens',
  })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Matches(/^[a-zA-Z0-9\s-]+$/, {
    each: true,
    message: 'Travel styles can only contain letters, numbers, spaces and hyphens',
  })
  travelStyles?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio is too long (max 500 characters)' })
  @Transform(({ value }) => value?.trim())
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City is too long (max 100 characters)' })
  @Transform(({ value }) => value?.trim())
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country is too long (max 100 characters)' })
  @Transform(({ value }) => value?.trim())
  country?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

  // Username (unique handle)
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Username is too long (max 30 characters)' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  username?: string;

  // Social links
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim().replace(/^@/, ''))
  instagramHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => value?.trim().replace(/^@/, ''))
  tiktokHandle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  youtubeUrl?: string;
}
