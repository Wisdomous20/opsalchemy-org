import type {
  ConversationChannel,
  KnowledgeCitation,
} from "@/domain/conversations/conversation";

export interface AIConversationRequest {
  readonly conversationId: string;
  readonly channel: ConversationChannel;
  readonly userMessage: string;
  readonly relevantKnowledge: readonly KnowledgeCitation[];
}

export interface AIConversationResponse {
  readonly answer: string;
  readonly citations: readonly KnowledgeCitation[];
}

export interface AIConversationGateway {
  respond(request: AIConversationRequest): Promise<AIConversationResponse>;
}
