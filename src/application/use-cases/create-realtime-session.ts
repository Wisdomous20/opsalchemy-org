import type {
  RealtimeClientSession,
  RealtimeSessionGateway,
} from "@/application/ports/realtime-session-gateway";

export class RealtimeUnavailableError extends Error {
  constructor() {
    super("Voice is temporarily unavailable.");
    this.name = "RealtimeUnavailableError";
  }
}

export class CreateRealtimeSession {
  constructor(private readonly gateway: RealtimeSessionGateway) {}

  async execute(conversationId: string): Promise<RealtimeClientSession> {
    try {
      return await this.gateway.createClientSession(conversationId);
    } catch {
      throw new RealtimeUnavailableError();
    }
  }
}
