import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStorageHighScoreAdapter } from './localStorageHighScoreAdapter';
import { MAX_STORED_HIGH_SCORES } from '../config/constants';

describe('createLocalStorageHighScoreAdapter', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('kayıt yokken boş liste döner', async () => {
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    await expect(storage.getTopScores(10)).resolves.toEqual([]);
  });

  it('gönderilen skoru kaydeder ve geri okur', async () => {
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    await storage.submitScore({ name: 'Ada', score: 100, achievedAt: '2024-01-01T00:00:00.000Z' });
    const top = await storage.getTopScores(10);

    expect(top).toHaveLength(1);
    expect(top[0]).toMatchObject({ name: 'Ada', score: 100, schemaVersion: 1 });
  });

  it('skorları büyükten küçüğe sıralar', async () => {
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    await storage.submitScore({ name: 'A', score: 50, achievedAt: 'x' });
    await storage.submitScore({ name: 'B', score: 200, achievedAt: 'x' });
    await storage.submitScore({ name: 'C', score: 100, achievedAt: 'x' });

    const top = await storage.getTopScores(10);

    expect(top.map((entry) => entry.name)).toEqual(['B', 'C', 'A']);
  });

  it('limit parametresine göre listeyi kısaltır', async () => {
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);
    await storage.submitScore({ name: 'A', score: 1, achievedAt: 'x' });
    await storage.submitScore({ name: 'B', score: 2, achievedAt: 'x' });

    const top = await storage.getTopScores(1);

    expect(top).toHaveLength(1);
    expect(top[0]?.name).toBe('B');
  });

  it('bozuk (kurcalanmış) JSON verisi karşısında çökmez, boş liste döner', async () => {
    window.localStorage.setItem('yildiz-savasi:high-scores:v1', '{not-valid-json');
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    await expect(storage.getTopScores(10)).resolves.toEqual([]);
  });

  it('şemaya uymayan (schemaVersion eksik/yanlış) kayıtları filtreler', async () => {
    window.localStorage.setItem(
      'yildiz-savasi:high-scores:v1',
      JSON.stringify([
        { name: 'Geçerli', score: 10, achievedAt: 'x', schemaVersion: 1 },
        { name: 'Geçersiz', score: 20 },
        { schemaVersion: 2, name: 'GelecekŞema', score: 30, achievedAt: 'x' },
      ]),
    );
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    const top = await storage.getTopScores(10);

    expect(top).toHaveLength(1);
    expect(top[0]?.name).toBe('Geçerli');
  });

  it('dizi içindeki obje olmayan (ör. string/null) girdileri filtreler', async () => {
    window.localStorage.setItem(
      'yildiz-savasi:high-scores:v1',
      JSON.stringify([
        'bir string',
        null,
        { name: 'Geçerli', score: 10, achievedAt: 'x', schemaVersion: 1 },
      ]),
    );
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    const top = await storage.getTopScores(10);

    expect(top).toHaveLength(1);
    expect(top[0]?.name).toBe('Geçerli');
  });

  it(`en fazla ${MAX_STORED_HIGH_SCORES} kayıt saklar, fazlasını (en düşük skorlardan) budar`, async () => {
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    for (let i = 0; i < MAX_STORED_HIGH_SCORES + 5; i += 1) {
      await storage.submitScore({ name: `P${i}`, score: i, achievedAt: 'x' });
    }

    const raw = window.localStorage.getItem('yildiz-savasi:high-scores:v1');
    const stored: unknown[] = raw ? (JSON.parse(raw) as unknown[]) : [];

    expect(stored).toHaveLength(MAX_STORED_HIGH_SCORES);
    // En düşük skorlu ilk girdiler (0..4) budanmış olmalı.
    const top = await storage.getTopScores(MAX_STORED_HIGH_SCORES);
    expect(top.some((entry) => entry.name === 'P0')).toBe(false);
    expect(top.some((entry) => entry.name === `P${MAX_STORED_HIGH_SCORES + 4}`)).toBe(true);
  });

  it('dizi olmayan bir kök değeri karşısında boş liste döner', async () => {
    window.localStorage.setItem(
      'yildiz-savasi:high-scores:v1',
      JSON.stringify({ not: 'an array' }),
    );
    const storage = createLocalStorageHighScoreAdapter(window.localStorage);

    await expect(storage.getTopScores(10)).resolves.toEqual([]);
  });
});
