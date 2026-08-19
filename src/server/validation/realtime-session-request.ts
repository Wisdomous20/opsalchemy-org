import { z } from "zod";

export const realtimeSessionRequestSchema = z.object({
  conversationId: z.string().uuid(),
});
