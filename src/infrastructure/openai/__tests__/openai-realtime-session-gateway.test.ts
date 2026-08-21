import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIRealtimeSessionGateway } from "../openai-realtime-session-gateway";

vi.mock("server-only", () => ({}));

describe("OpenAIRealtimeSessionGateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("configures distinct calendar tools and a non-repetitive booking flow", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        value: "ek_test_client_secret",
        expires_at: Math.floor(Date.now() / 1_000) + 60,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const gateway = new OpenAIRealtimeSessionGateway({
      apiKey: "test-api-key",
      model: "gpt-realtime-test",
      schedulingEnabled: true,
    });
    await gateway.createClientSession("5a37b573-b3f9-4768-8b3a-e240abbcc933");

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    const toolNames = body.session.tools.map((tool: { name: string }) => tool.name);

    expect(toolNames).toContain("find_consultation_slots");
    expect(toolNames).toContain("schedule_consultation");
    expect(body.session.instructions).toContain("Do not repeat the visitor's words");
    expect(body.session.instructions).toContain(
      "Do not repeat the summary or ask for confirmation again",
    );
    expect(body.session.instructions).toContain(
      "type their full name, email address, and mobile number with country code",
    );
    const scheduleTool = body.session.tools.find(
      (tool: { name: string }) => tool.name === "schedule_consultation",
    );
    expect(scheduleTool.parameters.required).toEqual(
      expect.arrayContaining(["attendeePhone", "contactConsent"]),
    );
    expect(body.session.instructions).toContain("Read displayTime exactly as provided");
    expect(body.session.audio.input.transcription).not.toHaveProperty("prompt");
    expect(body.session.audio.input.turn_detection.interrupt_response).toBe(false);
  });
});
