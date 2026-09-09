/**
 * Depolamadan bağımsız yüksek skor arayüzü (bkz. docs/adr/0003-persistence-abstraction.md).
 * Oyun/UI katmanı yalnızca bu arayüze bağımlıdır; bugün localStorage,
 * yarın REST/WebSocket adaptörü aynı arayüzü implement edebilir.
 */
export interface HighScoreEntry {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly score: number;
  /** ISO-8601 zaman damgası. */
  readonly achievedAt: string;
}

export interface HighScoreStorage {
  getTopScores(limit: number): Promise<HighScoreEntry[]>;
  submitScore(entry: Omit<HighScoreEntry, 'schemaVersion'>): Promise<void>;
}
