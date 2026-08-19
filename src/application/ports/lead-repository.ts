import type { Lead } from "@/domain/leads/lead";

export interface LeadRepository {
  findByEmail(email: string): Promise<Lead | null>;
  save(lead: Lead): Promise<void>;
}
