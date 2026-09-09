import { describe, expect, it } from 'vitest';
import { hueForLevel, levelFlashAlpha, tickLevelFlash, triggerLevelFlash } from './levelFlash';

describe('hueForLevel', () => {
  it('ardışık seviyeler için farklı renkler üretir', () => {
    expect(hueForLevel(1)).not.toBe(hueForLevel(2));
  });

  it('0-360 derece aralığında bir değer döner', () => {
    for (const level of [1, 2, 5, 10, 50, 1000]) {
      const hue = hueForLevel(level);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });
});

describe('triggerLevelFlash', () => {
  it('verilen renk ve süreyle bir flaş durumu üretir', () => {
    expect(triggerLevelFlash(120, 400)).toEqual({ hue: 120, totalMs: 400, remainingMs: 400 });
  });
});

describe('tickLevelFlash', () => {
  it('durum yoksa null döner', () => {
    expect(tickLevelFlash(null, 16)).toBeNull();
  });

  it('kalan süreyi azaltır', () => {
    const state = triggerLevelFlash(120, 400);

    const result = tickLevelFlash(state, 100);

    expect(result).toEqual({ hue: 120, totalMs: 400, remainingMs: 300 });
  });

  it('süre dolunca null döner', () => {
    const state = triggerLevelFlash(120, 100);

    const result = tickLevelFlash(state, 150);

    expect(result).toBeNull();
  });
});

describe('levelFlashAlpha', () => {
  it('durum yoksa 0 döner', () => {
    expect(levelFlashAlpha(null, 0.4)).toBe(0);
  });

  it('flaş başlangıcında maxAlpha döner', () => {
    const state = triggerLevelFlash(120, 400);

    expect(levelFlashAlpha(state, 0.4)).toBeCloseTo(0.4);
  });

  it('süre azaldıkça opaklık orantılı olarak azalır', () => {
    const state = tickLevelFlash(triggerLevelFlash(120, 400), 300)!;

    expect(levelFlashAlpha(state, 0.4)).toBeCloseTo(0.1);
  });
});
