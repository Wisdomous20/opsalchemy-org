import type {
  LeadQueryRepository,
  LeadReadModel,
} from "@/application/ports/lead-query-repository";

const DEMO_LEAD_LIMIT = 100;

export class ListLeads {
  constructor(private readonly repository: LeadQueryRepository) {}

  execute(): Promise<readonly LeadReadModel[]> {
    return this.repository.findRecent(DEMO_LEAD_LIMIT);
  }
}
