import { describe, expect, it } from 'vitest';
import { tickEnemyFiring } from './enemyFiring';
import { createEnemy } from '../entities/enemy';
import {
  ENEMY_FIRE_COOLDOWN_MIN_SECONDS,
  ENEMY_FIRE_COOLDOWN_RANGE_SECONDS,
} from '../config/constants';

describe('tickEnemyFiring', () => {
  it("'straight' düşman hiçbir zaman ateş etmez", () => {
    const enemy = createEnemy(1, 100, 100, 50, 10, 'straight');

    const result = tickEnemyFiring([enemy], 100, 1, 1, () => 0);

    expect(result.newBullets).toHaveLength(0);
    expect(result.enemies[0]).toEqual(enemy);
  });

  it("'zigzag' düşman bekleme süresi dolmadan ateş etmez, süreyi azaltır", () => {
    const enemy = createEnemy(1, 100, 100, 50, 10, 'zigzag');

    const result = tickEnemyFiring([enemy], 0.5, 1, 1, () => 0);

    expect(result.newBullets).toHaveLength(0);
    expect(result.enemies[0]?.fireCooldownRemainingSeconds).toBeCloseTo(
      ENEMY_FIRE_COOLDOWN_MIN_SECONDS - 0.5,
      10,
    );
  });

  it("'tank' düşman bekleme süresi dolunca oyuncuya doğru mermi üretir", () => {
    const enemy = createEnemy(1, 100, 100, 50, 30, 'tank');

    const result = tickEnemyFiring([enemy], ENEMY_FIRE_COOLDOWN_MIN_SECONDS, 5, 1, () => 0);

    expect(result.newBullets).toHaveLength(1);
    expect(result.newBullets[0]?.id).toBe(5);
    expect(result.nextEnemyBulletId).toBe(6);
    expect(result.enemies[0]?.fireCooldownRemainingSeconds).toBeGreaterThan(0);
  });

  it('ateş edince bekleme süresini rastgele aralıkta yeniden başlatır', () => {
    const enemy = createEnemy(1, 100, 100, 50, 30, 'tank');

    const result = tickEnemyFiring([enemy], ENEMY_FIRE_COOLDOWN_MIN_SECONDS, 1, 1, () => 1);

    expect(result.enemies[0]?.fireCooldownRemainingSeconds).toBeCloseTo(
      ENEMY_FIRE_COOLDOWN_MIN_SECONDS + ENEMY_FIRE_COOLDOWN_RANGE_SECONDS,
      10,
    );
  });

  it('zorluk çarpanı arttıkça bir sonraki bekleme süresi kısalır', () => {
    const enemy = createEnemy(1, 100, 100, 50, 30, 'tank');

    const normal = tickEnemyFiring([enemy], ENEMY_FIRE_COOLDOWN_MIN_SECONDS, 1, 1, () => 0.5);
    const harder = tickEnemyFiring([enemy], ENEMY_FIRE_COOLDOWN_MIN_SECONDS, 1, 2, () => 0.5);

    expect(harder.enemies[0]!.fireCooldownRemainingSeconds).toBeLessThan(
      normal.enemies[0]!.fireCooldownRemainingSeconds,
    );
  });

  it('birden fazla ateş eden düşman için bağımsız çalışır', () => {
    const enemyA = createEnemy(1, 0, 0, 50, 10, 'zigzag');
    const enemyB = createEnemy(2, 0, 0, 50, 10, 'tank');

    const result = tickEnemyFiring(
      [enemyA, enemyB],
      ENEMY_FIRE_COOLDOWN_MIN_SECONDS,
      10,
      1,
      () => 0,
    );

    expect(result.newBullets).toHaveLength(2);
    expect(result.newBullets.map((b) => b.id)).toEqual([10, 11]);
  });
});
