import type {
  ConversationChannel,
  KnowledgeCitation,
} from "@/domain/conversations/conversation";
import type { ServiceId } from "@/domain/services/service-offering";

export interface ConversationTurn {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface AIConversationRequest {
  readonly conversationId: string;
  readonly channel: ConversationChannel;
  readonly userMessage: string;
  readonly history: readonly ConversationTurn[];
  readonly serviceCandidates: readonly ServiceId[];
}

export interface AIConversationResponse {
  readonly answer: string;
  readonly citations: readonly KnowledgeCitation[];
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  } | null;
}

export interface AIConversationGateway {
  respond(request: AIConversationRequest): Promise<AIConversationResponse>;
}
