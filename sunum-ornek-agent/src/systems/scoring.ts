import type { Enemy } from '../entities/enemy';

/** Yok edilen düşmanların puan değerlerini mevcut skora ekler. Saf fonksiyon. */
export function applyScoring(score: number, destroyedEnemies: readonly Enemy[]): number {
  return destroyedEnemies.reduce((total, enemy) => total + enemy.scoreValue, score);
}
