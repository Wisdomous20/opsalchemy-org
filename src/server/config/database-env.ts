import "server-only";

import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^postgres(?:ql)?:\/\//, "must be a PostgreSQL connection URL");

let cachedDatabaseUrl: string | undefined;

export function getDatabaseUrl(): string {
  if (cachedDatabaseUrl) return cachedDatabaseUrl;

  const result = databaseUrlSchema.safeParse(process.env.DATABASE_URL);
  if (!result.success) {
    throw new Error("Invalid database configuration: DATABASE_URL");
  }

  cachedDatabaseUrl = result.data;
  return cachedDatabaseUrl;
}
