import {
  EXPLOSION_PARTICLE_COUNT,
  PARTICLE_LIFE_RANGE_SECONDS,
  PARTICLE_MIN_LIFE_SECONDS,
  PARTICLE_MIN_SPEED_PX_PER_SEC,
  PARTICLE_SPEED_RANGE_PX_PER_SEC,
} from '../config/constants';

export interface Particle {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly ageSeconds: number;
  readonly lifeSeconds: number;
}

/** Bir noktadan her yöne dağılan kısa ömürlü parçacıklar üretir. `random` enjekte edilebilir (deterministik test için). */
export function createExplosion(
  x: number,
  y: number,
  count: number = EXPLOSION_PARTICLE_COUNT,
  random: () => number = Math.random,
): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = random() * Math.PI * 2;
    const speed = PARTICLE_MIN_SPEED_PX_PER_SEC + random() * PARTICLE_SPEED_RANGE_PX_PER_SEC;
    return {
      x,
      y,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      ageSeconds: 0,
      lifeSeconds: PARTICLE_MIN_LIFE_SECONDS + random() * PARTICLE_LIFE_RANGE_SECONDS,
    };
  });
}

/** Parçacıkları ilerletir; ömrü dolanı listeden düşürür. */
export function updateParticles(particles: readonly Particle[], dt: number): Particle[] {
  return particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.velocityX * dt,
      y: particle.y + particle.velocityY * dt,
      ageSeconds: particle.ageSeconds + dt,
    }))
    .filter((particle) => particle.ageSeconds < particle.lifeSeconds);
}
