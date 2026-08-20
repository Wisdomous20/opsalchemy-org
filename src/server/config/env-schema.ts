import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();

const serverEnvSchema = z
  .object({
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
    GOOGLE_OAUTH_CLIENT_ID: optionalSecret,
    GOOGLE_OAUTH_CLIENT_SECRET: optionalSecret,
    GOOGLE_OAUTH_REFRESH_TOKEN: optionalSecret,
    GOOGLE_CALENDAR_ID: z.string().trim().min(1).optional(),
    GOOGLE_CALENDAR_EVENT_TITLE: z.string().trim().min(1).max(200).optional(),
  })
  .superRefine((environment, context) => {
    const requiredGoogleFields = [
      "GOOGLE_OAUTH_CLIENT_ID",
      "GOOGLE_OAUTH_CLIENT_SECRET",
      "GOOGLE_OAUTH_REFRESH_TOKEN",
      "GOOGLE_CALENDAR_ID",
    ] as const;
    const configuredCount = requiredGoogleFields.filter(
      (field) => environment[field],
    ).length;

    if (configuredCount > 0 && configuredCount < requiredGoogleFields.length) {
      for (const field of requiredGoogleFields) {
        if (!environment[field]) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: "is required when Google Calendar scheduling is configured",
          });
        }
      }
    }
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
