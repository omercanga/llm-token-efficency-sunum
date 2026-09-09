import { describe, expect, it } from 'vitest';
import { createStarfield, updateStarfield } from './starfield';

describe('createStarfield', () => {
  it('istenen sayıda yıldız üretir', () => {
    const stars = createStarfield(10, 100, 200);
    expect(stars).toHaveLength(10);
  });

  it('deterministik bir random fonksiyonuyla sınırlar içinde konum üretir', () => {
    const stars = createStarfield(3, 100, 200, () => 0.5);

    for (const star of stars) {
      expect(star.x).toBe(50);
      expect(star.y).toBe(100);
      expect(star.speed).toBeGreaterThan(0);
      expect(star.size).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('updateStarfield', () => {
  it("yıldızı hızına ve dt'ye göre aşağı kaydırır", () => {
    const stars = [{ x: 10, y: 0, speed: 30, size: 1 }];

    const result = updateStarfield(stars, 1, 200);

    expect(result[0]?.y).toBe(30);
    expect(result[0]?.x).toBe(10);
  });

  it('ekranın altına geçen yıldızı üstten yeniden başlatır', () => {
    const stars = [{ x: 10, y: 190, speed: 30, size: 1 }];

    const result = updateStarfield(stars, 1, 200);

    expect(result[0]?.y).toBe(20);
  });

  it('orijinal diziyi mutasyona uğratmaz', () => {
    const stars = [{ x: 10, y: 0, speed: 30, size: 1 }];

    updateStarfield(stars, 1, 200);

    expect(stars[0]?.y).toBe(0);
  });
});
