import { describe, expect, it } from 'vitest';
import {
  detectCollisions,
  detectEnemyBulletHits,
  detectPowerUpPickup,
  rectsIntersect,
} from './collision';
import { createBullet } from '../entities/bullet';
import { createEnemy } from '../entities/enemy';
import { createEnemyBullet } from '../entities/enemyBullet';
import { createPlayer } from '../entities/player';
import { createPowerUp } from '../entities/powerUp';

describe('rectsIntersect', () => {
  it('kesişen iki dikdörtgen için true döner', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true);
  });

  it('kesişmeyen iki dikdörtgen için false döner', () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 100, y: 100, width: 10, height: 10 },
      ),
    ).toBe(false);
  });

  it('yalnızca kenardan değen (dokunan ama örtüşmeyen) dikdörtgenler için false döner', () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }),
    ).toBe(false);
  });
});

describe('detectCollisions', () => {
  const player = createPlayer(200, 600);

  it('bir mermi bir düşmanla çakışırsa ikisini de yok eder ve skora ekler', () => {
    const bullet = createBullet(1, 100, 100);
    const enemy = createEnemy(1, 98, 98, 50);

    const result = detectCollisions([bullet], [enemy], player);

    expect(result.survivingBullets).toHaveLength(0);
    expect(result.survivingEnemies).toHaveLength(0);
    expect(result.destroyedEnemies).toEqual([enemy]);
    expect(result.playerHits).toBe(0);
  });

  it('çakışma yoksa hiçbir şey değişmez', () => {
    const bullet = createBullet(1, 400, 400);
    const enemy = createEnemy(1, 10, 10, 50);

    const result = detectCollisions([bullet], [enemy], player);

    expect(result.survivingBullets).toEqual([bullet]);
    expect(result.survivingEnemies).toEqual([enemy]);
    expect(result.destroyedEnemies).toHaveLength(0);
  });

  it('düşman oyuncuyla çakışırsa yok edilir ve playerHits artar', () => {
    const enemy = createEnemy(1, player.x, player.y, 50);

    const result = detectCollisions([], [enemy], player);

    expect(result.survivingEnemies).toHaveLength(0);
    expect(result.playerHits).toBe(1);
  });

  it('bir düşman yalnızca bir mermi tarafından yok edilebilir; aynı hedefi paylaşan diğer mermi hayatta kalır', () => {
    const bulletA = createBullet(1, 100, 100);
    const bulletB = createBullet(2, 100, 100);
    const enemy = createEnemy(1, 98, 98, 50);

    const result = detectCollisions([bulletA, bulletB], [enemy], player);

    expect(result.destroyedEnemies).toHaveLength(1);
    expect(result.survivingBullets).toEqual([bulletB]);
  });

  it('birden fazla düşman ve mermi arasında doğru eşleştirme yapar', () => {
    const bullet = createBullet(1, 100, 100);
    const nearEnemy = createEnemy(1, 98, 98, 50);
    const farEnemy = createEnemy(2, 300, 300, 50);

    const result = detectCollisions([bullet], [nearEnemy, farEnemy], player);

    expect(result.destroyedEnemies).toEqual([nearEnemy]);
    expect(result.survivingEnemies).toEqual([farEnemy]);
  });

  it("'tank' düşman tek vuruşta yok olmaz, hp'si azalarak hayatta kalır", () => {
    const bullet = createBullet(1, 100, 100);
    const tank = createEnemy(1, 98, 98, 50, 30, 'tank');

    const result = detectCollisions([bullet], [tank], player);

    expect(result.destroyedEnemies).toHaveLength(0);
    expect(result.survivingEnemies).toHaveLength(1);
    expect(result.survivingEnemies[0]?.hp).toBe(tank.hp - 1);
    // Vurduğu mermi yine de tüketilir.
    expect(result.survivingBullets).toHaveLength(0);
  });

  it("'tank' düşman hp'si kadar vuruş alınca yok olur", () => {
    const bulletA = createBullet(1, 100, 100);
    const bulletB = createBullet(2, 100, 100);
    const tank = createEnemy(1, 98, 98, 50, 30, 'tank');

    const result = detectCollisions([bulletA, bulletB], [tank], player);

    expect(result.destroyedEnemies).toHaveLength(1);
    expect(result.survivingEnemies).toHaveLength(0);
  });

  it('delici (piercing) mermi bir düşmana çarpınca yok olmaz, hayatta kalır', () => {
    const piercingBullet = createBullet(1, 100, 100, true);
    const enemy = createEnemy(1, 98, 98, 50);

    const result = detectCollisions([piercingBullet], [enemy], player);

    expect(result.destroyedEnemies).toHaveLength(1);
    expect(result.survivingBullets).toEqual([piercingBullet]);
  });

  it('delici mermi aynı karede hizalı birden fazla düşmana isabet edebilir', () => {
    const piercingBullet = createBullet(1, 100, 100, true);
    const enemyA = createEnemy(1, 98, 98, 50, 10);
    const enemyB = createEnemy(2, 99, 99, 50, 10);

    const result = detectCollisions([piercingBullet], [enemyA, enemyB], player);

    expect(result.destroyedEnemies).toHaveLength(2);
    expect(result.survivingBullets).toEqual([piercingBullet]);
  });
});

describe('detectPowerUpPickup', () => {
  const player = createPlayer(200, 600);

  it('oyuncuyla çakışan power-up toplanır ve listeden düşer', () => {
    const powerUp = createPowerUp(1, player.x, player.y, 'rapidFire');

    const result = detectPowerUpPickup([powerUp], player);

    expect(result.collectedPowerUps).toEqual([powerUp]);
    expect(result.survivingPowerUps).toHaveLength(0);
  });

  it('oyuncuyla çakışmayan power-up hayatta kalır', () => {
    const powerUp = createPowerUp(1, 0, 0, 'multiShot');

    const result = detectPowerUpPickup([powerUp], player);

    expect(result.collectedPowerUps).toHaveLength(0);
    expect(result.survivingPowerUps).toEqual([powerUp]);
  });
});

describe('detectEnemyBulletHits', () => {
  const player = createPlayer(200, 600);

  it('oyuncuya isabet eden düşman mermisi listeden düşer, playerHits artar', () => {
    const bullet = createEnemyBullet(1, player.x, player.y);

    const result = detectEnemyBulletHits([bullet], player);

    expect(result.survivingEnemyBullets).toHaveLength(0);
    expect(result.playerHits).toBe(1);
  });

  it('oyuncuya isabet etmeyen düşman mermisi hayatta kalır', () => {
    const bullet = createEnemyBullet(1, 0, 0);

    const result = detectEnemyBulletHits([bullet], player);

    expect(result.survivingEnemyBullets).toEqual([bullet]);
    expect(result.playerHits).toBe(0);
  });

  it('birden fazla isabet eden mermi için playerHits toplam sayıyı verir', () => {
    const bulletA = createEnemyBullet(1, player.x, player.y);
    const bulletB = createEnemyBullet(2, player.x, player.y);

    const result = detectEnemyBulletHits([bulletA, bulletB], player);

    expect(result.playerHits).toBe(2);
    expect(result.survivingEnemyBullets).toHaveLength(0);
  });
});
