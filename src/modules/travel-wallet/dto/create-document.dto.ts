import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  subtitle?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
