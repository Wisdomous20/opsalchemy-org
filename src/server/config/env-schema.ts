import { z } from "zod";

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .trim()
    .min(20, "must be a non-empty server API key")
    .startsWith("sk-", "must be an OpenAI project API key"),
  OPENAI_VECTOR_STORE_ID: z
    .string()
    .trim()
    .regex(/^vs_[A-Za-z0-9]+$/, "must be an OpenAI vector store ID"),
  OPENAI_TEXT_MODEL: z.string().trim().min(1, "must name a text model"),
  OPENAI_REALTIME_MODEL: z.string().trim().min(1, "must name a realtime model"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  environment: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(environment);

  if (!result.success) {
    const invalidFields = [
      ...new Set(
        result.error.issues.map((issue) => issue.path.join(".") || "environment"),
      ),
    ];

    throw new Error(`Invalid server configuration: ${invalidFields.join(", ")}`);
  }

  return result.data;
}
