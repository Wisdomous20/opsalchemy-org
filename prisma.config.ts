import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma CLI operations should bypass Supabase's transaction pooler.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
