import "server-only";

import { ListLeads } from "@/application/use-cases/list-leads";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaLeadQueryRepository } from "@/infrastructure/prisma/prisma-lead-query-repository";
import { getDatabaseUrl } from "@/server/config/database-env";

let useCase: ListLeads | undefined;

export function createListLeads(databaseUrl: string): ListLeads {
  return new ListLeads(new PrismaLeadQueryRepository(createPrismaClient(databaseUrl)));
}

export function getListLeads(): ListLeads {
  useCase ??= createListLeads(getDatabaseUrl());
  return useCase;
}
