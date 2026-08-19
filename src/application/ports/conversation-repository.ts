import type { Conversation } from "@/domain/conversations/conversation";

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
}
