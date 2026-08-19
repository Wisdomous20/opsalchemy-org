import type { KnowledgeCitation } from "@/domain/conversations/conversation";

export interface KnowledgeSearchResult {
  readonly content: string;
  readonly score: number | null;
  readonly citation: KnowledgeCitation;
}

export interface KnowledgeRepository {
  search(query: string, limit: number): Promise<readonly KnowledgeSearchResult[]>;
}
