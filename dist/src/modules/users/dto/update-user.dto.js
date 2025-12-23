"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = exports.LanguageDto = exports.LanguageLevel = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const class_validator_2 = require("class-validator");
var LanguageLevel;
(function (LanguageLevel) {
    LanguageLevel["native"] = "native";
    LanguageLevel["fluent"] = "fluent";
    LanguageLevel["conversational"] = "conversational";
    LanguageLevel["basic"] = "basic";
})(LanguageLevel || (exports.LanguageLevel = LanguageLevel = {}));
class LanguageDto {
    language;
    level;
}
exports.LanguageDto = LanguageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], LanguageDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_2.IsEnum)(LanguageLevel),
    __metadata("design:type", String)
], LanguageDto.prototype, "level", void 0);
class UpdateUserDto {
    fullName;
    email;
    photoUrl;
    archetypes;
    interests;
    travelStyles;
    bio;
    city;
    country;
    languages;
    username;
    instagramHandle;
    tiktokHandle;
    youtubeUrl;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    (0, class_validator_1.MaxLength)(255),
    (0, class_transformer_1.Transform)(({ value }) => value?.toLowerCase().trim()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({
        protocols: ['https'],
        require_protocol: true,
        require_valid_protocol: true,
    }, { message: 'Photo URL must be a valid HTTPS URL' }),
    (0, class_validator_1.MaxLength)(2048),
    (0, class_validator_1.Matches)(/^https:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, {
        message: 'Photo URL must be a valid HTTPS URL',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "photoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(2),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(50, { each: true }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9\s-]+$/, {
        each: true,
        message: 'Archetypes can only contain letters, numbers, spaces and hyphens',
    }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "archetypes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(50, { each: true }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9\s-]+$/, {
        each: true,
        message: 'Interests can only contain letters, numbers, spaces and hyphens',
    }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "interests", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(50, { each: true }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9\s-]+$/, {
        each: true,
        message: 'Travel styles can only contain letters, numbers, spaces and hyphens',
    }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "travelStyles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Bio is too long (max 500 characters)' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'City is too long (max 100 characters)' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'Country is too long (max 100 characters)' }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_2.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LanguageDto),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "languages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30, { message: 'Username is too long (max 30 characters)' }),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers, and underscores',
    }),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim().toLowerCase()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim().replace(/^@/, '')),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "instagramHandle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim().replace(/^@/, '')),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "tiktokHandle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim()),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "youtubeUrl", void 0);
//# sourceMappingURL=update-user.dto.js.map