import type { Bullet } from '../entities/bullet';
import type { Enemy } from '../entities/enemy';
import type { EnemyBullet } from '../entities/enemyBullet';
import type { Player } from '../entities/player';
import type { PowerUp } from '../entities/powerUp';

export interface CollisionResult {
  readonly survivingBullets: readonly Bullet[];
  /** Hayatta kalan düşmanlar; 'tank' gibi çok can'lı düşmanlarda güncel `hp` ile. */
  readonly survivingEnemies: readonly Enemy[];
  readonly destroyedEnemies: readonly Enemy[];
  readonly playerHits: number;
}

export interface PowerUpPickupResult {
  readonly survivingPowerUps: readonly PowerUp[];
  readonly collectedPowerUps: readonly PowerUp[];
}

export interface EnemyBulletHitResult {
  readonly survivingEnemyBullets: readonly EnemyBullet[];
  readonly playerHits: number;
}

interface AxisAlignedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** İki eksene hizalı dikdörtgenin kesişip kesişmediğini kontrol eder (AABB). */
export function rectsIntersect(a: AxisAlignedRect, b: AxisAlignedRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Mermi↔düşman ve düşman↔oyuncu çarpışmalarını tespit eder. Saf fonksiyon:
 * yalnızca girdi listelerini okur, yeni listeler üretir. Birden çok can'lı
 * ('tank') düşmanlar, hp'leri 0'a düşene kadar hayatta kalır (güncel hp ile).
 */
export function detectCollisions(
  bullets: readonly Bullet[],
  enemies: readonly Enemy[],
  player: Player,
): CollisionResult {
  const remainingHpByEnemyId = new Map<number, number>(
    enemies.map((enemy) => [enemy.id, enemy.hp]),
  );
  const destroyedEnemyIds = new Set<number>();
  const destroyedBulletIds = new Set<number>();

  for (const bullet of bullets) {
    for (const enemy of enemies) {
      if (destroyedEnemyIds.has(enemy.id)) continue;
      if (rectsIntersect(bullet, enemy)) {
        // Delici (piercing) mermi vurduğu düşmanı yok etmeden yoluna devam eder;
        // aynı karede hizalı başka düşmanlara da isabet edebilir.
        if (!bullet.piercing) {
          destroyedBulletIds.add(bullet.id);
        }
        // remainingHpByEnemyId, enemies dizisindeki her id için önceden dolduruldu (bkz. yukarısı) — her zaman mevcut.
        const remainingHp = remainingHpByEnemyId.get(enemy.id)! - 1;
        remainingHpByEnemyId.set(enemy.id, remainingHp);
        if (remainingHp <= 0) {
          destroyedEnemyIds.add(enemy.id);
        }
        if (!bullet.piercing) {
          break;
        }
      }
    }
  }

  let playerHits = 0;
  for (const enemy of enemies) {
    if (destroyedEnemyIds.has(enemy.id)) continue;
    if (rectsIntersect(enemy, player)) {
      destroyedEnemyIds.add(enemy.id);
      playerHits += 1;
    }
  }

  return {
    survivingBullets: bullets.filter((bullet) => !destroyedBulletIds.has(bullet.id)),
    survivingEnemies: enemies
      .filter((enemy) => !destroyedEnemyIds.has(enemy.id))
      .map((enemy) => ({ ...enemy, hp: remainingHpByEnemyId.get(enemy.id)! })),
    destroyedEnemies: enemies.filter((enemy) => destroyedEnemyIds.has(enemy.id)),
    playerHits,
  };
}

/** Oyuncunun temas ettiği power-up'ları tespit eder; toplananlar listeden düşer. */
export function detectPowerUpPickup(
  powerUps: readonly PowerUp[],
  player: Player,
): PowerUpPickupResult {
  const collectedPowerUps = powerUps.filter((powerUp) => rectsIntersect(powerUp, player));
  const collectedIds = new Set(collectedPowerUps.map((powerUp) => powerUp.id));

  return {
    survivingPowerUps: powerUps.filter((powerUp) => !collectedIds.has(powerUp.id)),
    collectedPowerUps,
  };
}

/** Düşman mermilerinin oyuncuya isabet edip etmediğini tespit eder; isabet edenler listeden düşer. */
export function detectEnemyBulletHits(
  enemyBullets: readonly EnemyBullet[],
  player: Player,
): EnemyBulletHitResult {
  const hitBullets = enemyBullets.filter((bullet) => rectsIntersect(bullet, player));
  const hitIds = new Set(hitBullets.map((bullet) => bullet.id));

  return {
    survivingEnemyBullets: enemyBullets.filter((bullet) => !hitIds.has(bullet.id)),
    playerHits: hitBullets.length,
  };
}
