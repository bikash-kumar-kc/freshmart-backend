export interface IOtpRecord {
  code: string;
  expiresAt: number;
  attemptsUsed: number;
  lastSentAt: number;
}
