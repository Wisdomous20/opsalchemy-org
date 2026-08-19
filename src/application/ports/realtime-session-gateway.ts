export interface RealtimeClientSession {
  readonly clientSecret: string;
  readonly expiresAt: Date;
}

export interface RealtimeSessionGateway {
  createClientSession(conversationId: string): Promise<RealtimeClientSession>;
}
