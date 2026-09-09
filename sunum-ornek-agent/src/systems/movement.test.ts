import { describe, expect, it } from 'vitest';
import {
  createPlayAreaBounds,
  moveBullets,
  moveEnemies,
  moveEnemyBullets,
  movePlayer,
  movePowerUps,
} from './movement';
import { createPlayer } from '../entities/player';
import { createBullet } from '../entities/bullet';
import { createEnemy } from '../entities/enemy';
import { createEnemyBullet } from '../entities/enemyBullet';
import { createPowerUp } from '../entities/powerUp';
import {
  BULLET_SPEED_PX_PER_SEC,
  ENEMY_BULLET_SPEED_PX_PER_SEC,
  PLAYER_SPEED_PX_PER_SEC,
  POWER_UP_FALL_SPEED_PX_PER_SEC,
} from '../config/constants';
import type { InputSnapshot } from '../engine/input';

const noInput: InputSnapshot = { up: false, down: false, left: false, right: false, fire: false };
const bounds = createPlayAreaBounds(480, 640, 28, 28);

describe('movePlayer', () => {
  it('girdi yokken yerinde kalır', () => {
    const player = createPlayer(100, 100);

    const result = movePlayer(player, noInput, 1, bounds);

    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it("sağ tuşuyla hıza ve dt'ye göre sağa hareket eder", () => {
    const player = createPlayer(100, 100);

    const result = movePlayer(player, { ...noInput, right: true }, 1, bounds);

    expect(result.x).toBe(100 + PLAYER_SPEED_PX_PER_SEC);
  });

  it('sol ve yukarı aynı anda basılıyken çapraz hareketi normalize eder', () => {
    const player = createPlayer(200, 200);

    const result = movePlayer(player, { ...noInput, left: true, up: true }, 1, bounds);

    const expectedDelta = PLAYER_SPEED_PX_PER_SEC / Math.sqrt(2);
    expect(result.x).toBeCloseTo(200 - expectedDelta, 5);
    expect(result.y).toBeCloseTo(200 - expectedDelta, 5);
  });

  it("aşağı tuşuyla hıza ve dt'ye göre aşağı hareket eder", () => {
    const player = createPlayer(100, 100);

    const result = movePlayer(player, { ...noInput, down: true }, 1, bounds);

    expect(result.y).toBe(100 + PLAYER_SPEED_PX_PER_SEC);
  });

  it('sol ve sağ aynı anda basılıyken birbirini götürür', () => {
    const player = createPlayer(200, 200);

    const result = movePlayer(player, { ...noInput, left: true, right: true }, 1, bounds);

    expect(result.x).toBe(200);
  });

  it('oynanabilir alanın dışına çıkmaz (sol kenar)', () => {
    const player = createPlayer(bounds.minX, 100);

    const result = movePlayer(player, { ...noInput, left: true }, 10, bounds);

    expect(result.x).toBe(bounds.minX);
  });

  it('oynanabilir alanın dışına çıkmaz (sağ kenar)', () => {
    const player = createPlayer(bounds.maxX, 100);

    const result = movePlayer(player, { ...noInput, right: true }, 10, bounds);

    expect(result.x).toBe(bounds.maxX);
  });

  it('orijinal player nesnesini mutasyona uğratmaz', () => {
    const player = createPlayer(100, 100);

    movePlayer(player, { ...noInput, right: true }, 1, bounds);

    expect(player.x).toBe(100);
  });
});

describe('moveBullets', () => {
  it('mermiyi hızına göre yukarı hareket ettirir', () => {
    const bullet = createBullet(1, 100, 300);

    const result = moveBullets([bullet], 0.1);

    expect(result[0]?.y).toBeCloseTo(300 - BULLET_SPEED_PX_PER_SEC * 0.1, 10);
  });

  it('ekranın üstünden çıkan mermiyi listeden düşürür', () => {
    const bullet = createBullet(1, 100, 5);

    const result = moveBullets([bullet], 1);

    expect(result).toHaveLength(0);
  });
});

describe('moveEnemies', () => {
  it('düşmanı hızına göre aşağı hareket ettirir', () => {
    const enemy = createEnemy(1, 100, 0, 50);

    const result = moveEnemies([enemy], 1, 640, 240);

    expect(result[0]?.y).toBe(50);
  });

  it('oynanabilir alanın altına geçen düşmanı listeden düşürür', () => {
    const enemy = createEnemy(1, 100, 635, 50);

    const result = moveEnemies([enemy], 1, 640, 240);

    expect(result).toHaveLength(0);
  });

  it('straight türü düşman yatayda hareket etmez', () => {
    const enemy = createEnemy(1, 100, 0, 50, 10, 'straight');

    const result = moveEnemies([enemy], 1, 640, 240);

    expect(result[0]?.x).toBe(100);
  });

  it('zigzag türü düşman spawn ekseni etrafında yatayda sallanır', () => {
    const enemy = createEnemy(1, 100, 0, 50, 10, 'zigzag');

    const result = moveEnemies([enemy], 0.5, 640, 240);

    expect(result[0]?.x).not.toBe(100);
    expect(result[0]?.ageSeconds).toBeCloseTo(0.5, 10);
  });

  it('her adımda ageSeconds birikir (mutasyon değil, yeni nesne)', () => {
    const enemy = createEnemy(1, 100, 0, 0, 10, 'zigzag');

    const result = moveEnemies([enemy], 0.3, 640, 240);

    expect(result[0]?.ageSeconds).toBeCloseTo(0.3, 10);
    expect(enemy.ageSeconds).toBe(0);
  });

  it("'diver' düşman, dalış eşiğine ulaşana kadar yatayda hareket etmez", () => {
    const enemy = createEnemy(1, 100, 0, 50, 10, 'diver');

    const result = moveEnemies([enemy], 1, 640, 400);

    expect(result[0]?.x).toBe(100);
  });

  it("'diver' düşman dalış eşiğini geçince oyuncuya doğru yönelir", () => {
    // maxY=640, DIVER_DIVE_TRIGGER_Y_RATIO=0.35 -> eşik 224. y=230 eşiği geçmiş.
    const enemy = createEnemy(1, 100, 230, 0, 10, 'diver');

    const result = moveEnemies([enemy], 1, 640, 400);

    expect(result[0]?.x).toBeGreaterThan(100);
  });

  it("'diver' düşman oyuncu solundaysa sola doğru yönelir", () => {
    const enemy = createEnemy(1, 300, 230, 0, 10, 'diver');

    const result = moveEnemies([enemy], 1, 640, 50);

    expect(result[0]?.x).toBeLessThan(300);
  });
});

describe('movePowerUps', () => {
  it("power-up'ı hızına göre aşağı hareket ettirir", () => {
    const powerUp = createPowerUp(1, 100, 0, 'rapidFire');

    const result = movePowerUps([powerUp], 1, 640);

    expect(result[0]?.y).toBe(POWER_UP_FALL_SPEED_PX_PER_SEC);
  });

  it("oynanabilir alanın altına geçen power-up'ı listeden düşürür", () => {
    const powerUp = createPowerUp(1, 100, 635, 'multiShot');

    const result = movePowerUps([powerUp], 1, 640);

    expect(result).toHaveLength(0);
  });
});

describe('moveEnemyBullets', () => {
  it('düşman mermisini hızına göre aşağı hareket ettirir', () => {
    const bullet = createEnemyBullet(1, 100, 0);

    const result = moveEnemyBullets([bullet], 1, 640);

    expect(result[0]?.y).toBe(ENEMY_BULLET_SPEED_PX_PER_SEC);
  });

  it('oynanabilir alanın altına geçen düşman mermisini listeden düşürür', () => {
    const bullet = createEnemyBullet(1, 100, 635);

    const result = moveEnemyBullets([bullet], 1, 640);

    expect(result).toHaveLength(0);
  });
});
