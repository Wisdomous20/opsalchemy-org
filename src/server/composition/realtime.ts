import "server-only";

import { CreateRealtimeSession } from "@/application/use-cases/create-realtime-session";
import { OpenAIRealtimeSessionGateway } from "@/infrastructure/openai/openai-realtime-session-gateway";
import { getServerEnv } from "@/server/config/env";

let useCase: CreateRealtimeSession | undefined;

export function getCreateRealtimeSession(): CreateRealtimeSession {
  if (useCase) return useCase;

  const environment = getServerEnv();
  useCase = new CreateRealtimeSession(
    new OpenAIRealtimeSessionGateway({
      apiKey: environment.OPENAI_API_KEY,
      model: environment.OPENAI_REALTIME_MODEL,
      schedulingEnabled: Boolean(
        environment.GOOGLE_OAUTH_CLIENT_ID &&
        environment.GOOGLE_OAUTH_CLIENT_SECRET &&
        environment.GOOGLE_OAUTH_REFRESH_TOKEN &&
        environment.GOOGLE_CALENDAR_ID,
      ),
    }),
  );
  return useCase;
}
