import type { HighScoreEntry, HighScoreStorage } from './highScoreStorage';
import { MAX_STORED_HIGH_SCORES } from '../config/constants';

const STORAGE_KEY = 'yildiz-savasi:high-scores:v1';

function isHighScoreEntry(value: unknown): value is HighScoreEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.name === 'string' &&
    typeof candidate.score === 'number' &&
    typeof candidate.achievedAt === 'string'
  );
}

function readAllEntries(storage: Storage): HighScoreEntry[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isHighScoreEntry);
  } catch {
    // Bozuk/kurcalanmış veri (bkz. docs/SECURITY.md — Tampering): sessizce boş listeye düş.
    return [];
  }
}

/** Bugünkü depolama adaptörü: `HighScoreStorage` arayüzünü `localStorage` üzerinde implement eder. */
export function createLocalStorageHighScoreAdapter(storage: Storage): HighScoreStorage {
  return {
    getTopScores(limit: number): Promise<HighScoreEntry[]> {
      const sorted = readAllEntries(storage).sort((a, b) => b.score - a.score);
      return Promise.resolve(sorted.slice(0, limit));
    },

    submitScore(entry: Omit<HighScoreEntry, 'schemaVersion'>): Promise<void> {
      const all = readAllEntries(storage);
      all.push({ ...entry, schemaVersion: 1 });
      // Sınırsız büyümeyi önlemek için yalnızca en iyi N kayıt saklanır.
      const bounded = all.sort((a, b) => b.score - a.score).slice(0, MAX_STORED_HIGH_SCORES);
      storage.setItem(STORAGE_KEY, JSON.stringify(bounded));
      return Promise.resolve();
    },
  };
}
