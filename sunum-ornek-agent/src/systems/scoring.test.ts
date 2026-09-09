import { describe, expect, it } from 'vitest';
import { applyScoring } from './scoring';
import { createEnemy } from '../entities/enemy';

describe('applyScoring', () => {
  it('yok edilen düşman yoksa skoru değiştirmez', () => {
    expect(applyScoring(100, [])).toBe(100);
  });

  it('her yok edilen düşmanın puanını toplam skora ekler', () => {
    const enemies = [createEnemy(1, 0, 0, 50, 10), createEnemy(2, 0, 0, 50, 25)];

    expect(applyScoring(100, enemies)).toBe(135);
  });
});
