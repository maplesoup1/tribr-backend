export declare enum LanguageLevel {
    native = "native",
    fluent = "fluent",
    conversational = "conversational",
    basic = "basic"
}
export declare class LanguageDto {
    language: string;
    level: LanguageLevel;
}
export declare class UpdateUserDto {
    fullName?: string;
    email?: string;
    photoUrl?: string;
    archetypes?: string[];
    interests?: string[];
    travelStyles?: string[];
    bio?: string;
    city?: string;
    country?: string;
    languages?: LanguageDto[];
    username?: string;
    instagramHandle?: string;
    tiktokHandle?: string;
    youtubeUrl?: string;
}
