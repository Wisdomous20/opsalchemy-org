import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../env-schema";

const validEnvironment = {
  OPENAI_API_KEY: `sk-${"x".repeat(24)}`,
  OPENAI_VECTOR_STORE_ID: "vs_abc123",
  OPENAI_TEXT_MODEL: "text-model",
  OPENAI_REALTIME_MODEL: "realtime-model",
};

describe("parseServerEnv", () => {
  it("returns a typed server configuration", () => {
    expect(parseServerEnv(validEnvironment)).toEqual(validEnvironment);
  });

  it("reports invalid field names without leaking secret values", () => {
    const exposedSecret = "not-a-valid-secret";

    expect(() =>
      parseServerEnv({
        ...validEnvironment,
        OPENAI_API_KEY: exposedSecret,
        OPENAI_VECTOR_STORE_ID: "invalid",
      }),
    ).toThrowError(
      "Invalid server configuration: OPENAI_API_KEY, OPENAI_VECTOR_STORE_ID",
    );

    try {
      parseServerEnv({
        ...validEnvironment,
        OPENAI_API_KEY: exposedSecret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(exposedSecret);
    }
  });

  it("requires the complete Google Calendar OAuth configuration when enabled", () => {
    expect(() =>
      parseServerEnv({
        ...validEnvironment,
        GOOGLE_OAUTH_CLIENT_ID: "client-id",
      }),
    ).toThrowError(
      "Invalid server configuration: GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN, GOOGLE_CALENDAR_ID",
    );
  });
});
