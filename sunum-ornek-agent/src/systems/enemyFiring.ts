import { FIRING_ENEMY_KINDS, type Enemy } from '../entities/enemy';
import { type EnemyBullet, createEnemyBullet } from '../entities/enemyBullet';
import {
  ENEMY_BULLET_WIDTH,
  ENEMY_FIRE_COOLDOWN_MIN_SECONDS,
  ENEMY_FIRE_COOLDOWN_RANGE_SECONDS,
} from '../config/constants';

export interface EnemyFiringResult {
  readonly enemies: readonly Enemy[];
  readonly newBullets: readonly EnemyBullet[];
  readonly nextEnemyBulletId: number;
}

/**
 * `FIRING_ENEMY_KINDS`'teki düşmanların ateşleme bekleme süresini azaltır;
 * süre dolunca oyuncuya doğru bir mermi üretir ve bekleme süresini rastgele
 * yeniden başlatır. `difficultyMultiplier` arttıkça ateş sıklığı da artar
 * (bkz. systems/spawn.ts). Saf fonksiyon: `random` enjekte edilebilir.
 */
export function tickEnemyFiring(
  enemies: readonly Enemy[],
  dt: number,
  nextEnemyBulletId: number,
  difficultyMultiplier: number,
  random: () => number = Math.random,
): EnemyFiringResult {
  let nextId = nextEnemyBulletId;
  const newBullets: EnemyBullet[] = [];

  const updatedEnemies = enemies.map((enemy) => {
    if (!FIRING_ENEMY_KINDS.has(enemy.kind)) {
      return enemy;
    }

    const remaining = enemy.fireCooldownRemainingSeconds - dt;
    if (remaining > 0) {
      return { ...enemy, fireCooldownRemainingSeconds: remaining };
    }

    newBullets.push(
      createEnemyBullet(
        nextId,
        enemy.x + enemy.width / 2 - ENEMY_BULLET_WIDTH / 2,
        enemy.y + enemy.height,
      ),
    );
    nextId += 1;

    const nextCooldown =
      (ENEMY_FIRE_COOLDOWN_MIN_SECONDS + random() * ENEMY_FIRE_COOLDOWN_RANGE_SECONDS) /
      difficultyMultiplier;

    return { ...enemy, fireCooldownRemainingSeconds: nextCooldown };
  });

  return { enemies: updatedEnemies, newBullets, nextEnemyBulletId: nextId };
}
