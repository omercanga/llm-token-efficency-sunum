import { describe, expect, it } from 'vitest';
import { createExplosion, updateParticles } from './particles';

describe('createExplosion', () => {
  it('istenen sayıda parçacık üretir', () => {
    const particles = createExplosion(100, 200, 8);
    expect(particles).toHaveLength(8);
  });

  it('her parçacık patlama noktasından başlar', () => {
    const particles = createExplosion(100, 200, 3, () => 0.5);
    for (const particle of particles) {
      expect(particle.x).toBe(100);
      expect(particle.y).toBe(200);
      expect(particle.ageSeconds).toBe(0);
      expect(particle.lifeSeconds).toBeGreaterThan(0);
    }
  });

  it('varsayılan sayıyı kullanır', () => {
    const particles = createExplosion(0, 0);
    expect(particles.length).toBeGreaterThan(0);
  });
});

describe('updateParticles', () => {
  it('parçacığı hızına göre hareket ettirir ve yaşını artırır', () => {
    const particles = [
      { x: 0, y: 0, velocityX: 10, velocityY: -20, ageSeconds: 0, lifeSeconds: 1 },
    ];

    const result = updateParticles(particles, 0.5);

    expect(result[0]).toMatchObject({ x: 5, y: -10, ageSeconds: 0.5 });
  });

  it('ömrü dolan parçacığı listeden düşürür', () => {
    const particles = [{ x: 0, y: 0, velocityX: 0, velocityY: 0, ageSeconds: 0.9, lifeSeconds: 1 }];

    const result = updateParticles(particles, 0.2);

    expect(result).toHaveLength(0);
  });

  it('orijinal diziyi mutasyona uğratmaz', () => {
    const particles = [{ x: 0, y: 0, velocityX: 1, velocityY: 1, ageSeconds: 0, lifeSeconds: 1 }];

    updateParticles(particles, 0.1);

    expect(particles[0]?.x).toBe(0);
  });
});
