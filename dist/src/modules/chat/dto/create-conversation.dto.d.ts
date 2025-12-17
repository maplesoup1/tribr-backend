export declare enum ConversationType {
    DM = "dm",
    GROUP = "group"
}
export declare class CreateConversationDto {
    participantIds: string[];
    type?: ConversationType;
}
