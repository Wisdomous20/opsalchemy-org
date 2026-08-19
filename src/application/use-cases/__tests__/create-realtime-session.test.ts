import { describe, expect, it } from "vitest";
import type {
  RealtimeClientSession,
  RealtimeSessionGateway,
} from "@/application/ports/realtime-session-gateway";
import {
  CreateRealtimeSession,
  RealtimeUnavailableError,
} from "@/application/use-cases/create-realtime-session";

class FakeRealtimeGateway implements RealtimeSessionGateway {
  constructor(
    private readonly result: RealtimeClientSession | Error,
    readonly conversations: string[] = [],
  ) {}

  async createClientSession(conversationId: string): Promise<RealtimeClientSession> {
    this.conversations.push(conversationId);
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

describe("CreateRealtimeSession", () => {
  it("delegates session creation through the realtime port", async () => {
    const session = {
      clientSecret: "ek_test_ephemeral",
      expiresAt: new Date("2026-08-19T08:00:00Z"),
    };
    const gateway = new FakeRealtimeGateway(session);
    const useCase = new CreateRealtimeSession(gateway);

    await expect(useCase.execute("conversation-id")).resolves.toEqual(session);
    expect(gateway.conversations).toEqual(["conversation-id"]);
  });

  it("translates infrastructure failures into an application error", async () => {
    const useCase = new CreateRealtimeSession(
      new FakeRealtimeGateway(new Error("upstream token response")),
    );

    await expect(useCase.execute("conversation-id")).rejects.toBeInstanceOf(
      RealtimeUnavailableError,
    );
  });
});
