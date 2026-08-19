export type ConversationChannel = "text" | "browser-voice";
export type ConversationStatus = "active" | "handed-off" | "closed";

export interface KnowledgeCitation {
  readonly sourceId: string;
  readonly title: string;
  readonly excerpt: string;
}

export interface Conversation {
  readonly id: string;
  readonly channel: ConversationChannel;
  readonly status: ConversationStatus;
  readonly startedAt: Date;
  readonly updatedAt: Date;
}
