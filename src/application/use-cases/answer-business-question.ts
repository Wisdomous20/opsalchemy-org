import type {
  AIConversationGateway,
  AIConversationResponse,
  ConversationTurn,
} from "@/application/ports/ai-conversation-gateway";
import type { ConversationChannel } from "@/domain/conversations/conversation";
import { classifyBusinessProblems } from "@/domain/services/classify-business-problems";
import { recommendServices } from "@/domain/services/recommend-services";

export interface AnswerBusinessQuestionInput {
  readonly conversationId: string;
  readonly message: string;
  readonly history: readonly ConversationTurn[];
  readonly channel?: ConversationChannel;
}

const INJECTION_SIGNALS = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /(reveal|show|print|repeat).{0,30}(system|developer) (prompt|message|instructions)/i,
  /(api[_ -]?key|vector[_ -]?store[_ -]?id|secret key)/i,
  /act as (an? )?(unrestricted|unfiltered|different) (ai|assistant|model)/i,
] as const;

export class AssistantUnavailableError extends Error {
  constructor() {
    super("The assistant is temporarily unavailable.");
    this.name = "AssistantUnavailableError";
  }
}

export class AnswerBusinessQuestion {
  constructor(private readonly gateway: AIConversationGateway) {}

  async execute(input: AnswerBusinessQuestionInput): Promise<AIConversationResponse> {
    const message = input.message.trim();

    if (INJECTION_SIGNALS.some((signal) => signal.test(message))) {
      return {
        answer:
          "I can help with OPSAlchemy's services and real estate operations, but I can't reveal private instructions, credentials, or internal configuration. What business challenge would you like help with?",
        citations: [],
        usage: null,
      };
    }

    const problems = classifyBusinessProblems(message);

    try {
      return await this.gateway.respond({
        conversationId: input.conversationId,
        channel: input.channel ?? "text",
        userMessage: message,
        history: input.history,
        serviceCandidates: recommendServices(problems),
      });
    } catch {
      throw new AssistantUnavailableError();
    }
  }
}
