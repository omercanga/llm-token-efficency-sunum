import type { Player } from '../entities/player';
import type { Bullet } from '../entities/bullet';
import type { Enemy } from '../entities/enemy';
import type { EnemyBullet } from '../entities/enemyBullet';
import type { PowerUp } from '../entities/powerUp';
import type { InputSnapshot } from '../engine/input';
import {
  BULLET_SPEED_PX_PER_SEC,
  DIVER_DIVE_TRIGGER_Y_RATIO,
  DIVER_HOMING_SPEED_PX_PER_SEC,
  ENEMY_BULLET_SPEED_PX_PER_SEC,
  PLAYER_SPEED_PX_PER_SEC,
  PLAY_AREA_MARGIN,
  POWER_UP_FALL_SPEED_PX_PER_SEC,
  ZIGZAG_AMPLITUDE_PX,
  ZIGZAG_FREQUENCY_RAD_PER_SEC,
} from '../config/constants';

export interface PlayAreaBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export function createPlayAreaBounds(
  canvasWidth: number,
  canvasHeight: number,
  entityWidth: number,
  entityHeight: number,
): PlayAreaBounds {
  return {
    minX: PLAY_AREA_MARGIN,
    maxX: canvasWidth - PLAY_AREA_MARGIN - entityWidth,
    minY: PLAY_AREA_MARGIN,
    maxY: canvasHeight - PLAY_AREA_MARGIN - entityHeight,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const DIAGONAL_NORMALIZATION = 1 / Math.sqrt(2);

/** Girdiye göre oyuncuyu hareket ettirir; çapraz hareketi normalize eder ve oynanabilir alana kelepçeler. */
export function movePlayer(
  player: Player,
  input: InputSnapshot,
  dt: number,
  bounds: PlayAreaBounds,
): Player {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

  if (dx !== 0 && dy !== 0) {
    dx *= DIAGONAL_NORMALIZATION;
    dy *= DIAGONAL_NORMALIZATION;
  }

  const x = clamp(player.x + dx * PLAYER_SPEED_PX_PER_SEC * dt, bounds.minX, bounds.maxX);
  const y = clamp(player.y + dy * PLAYER_SPEED_PX_PER_SEC * dt, bounds.minY, bounds.maxY);

  return { ...player, x, y };
}

/** Mermileri yukarı hareket ettirir; ekranın üstünden çıkanı listeden düşürür. */
export function moveBullets(bullets: readonly Bullet[], dt: number): Bullet[] {
  return bullets
    .map((bullet) => ({ ...bullet, y: bullet.y - BULLET_SPEED_PX_PER_SEC * dt }))
    .filter((bullet) => bullet.y + bullet.height >= 0);
}

/**
 * Düşmanları aşağı hareket ettirir; oynanabilir alanın altına geçeni listeden
 * düşürür (ceza yok). `zigzag` türü, spawn ekseni etrafında sinüs dalgasıyla
 * sağa-sola kayar. `diver` türü, ekranın belirli bir noktasına (bkz.
 * DIVER_DIVE_TRIGGER_Y_RATIO) ulaşınca oyuncunun anlık x konumuna doğru
 * yönelmeye başlar. Diğer türler yalnızca dikey hareket eder.
 */
export function moveEnemies(
  enemies: readonly Enemy[],
  dt: number,
  maxY: number,
  playerX: number,
): Enemy[] {
  const diveTriggerY = maxY * DIVER_DIVE_TRIGGER_Y_RATIO;

  return enemies
    .map((enemy) => {
      const ageSeconds = enemy.ageSeconds + dt;
      const y = enemy.y + enemy.speedPxPerSec * dt;

      let x = enemy.x;
      if (enemy.kind === 'zigzag') {
        x =
          enemy.spawnX + Math.sin(ageSeconds * ZIGZAG_FREQUENCY_RAD_PER_SEC) * ZIGZAG_AMPLITUDE_PX;
      } else if (enemy.kind === 'diver' && enemy.y >= diveTriggerY) {
        const direction = Math.sign(playerX - enemy.x);
        x = enemy.x + direction * DIVER_HOMING_SPEED_PX_PER_SEC * dt;
      }

      return { ...enemy, x, y, ageSeconds };
    })
    .filter((enemy) => enemy.y <= maxY);
}

/** Power-up'ları aşağı süzdürür; oynanabilir alanın altına geçeni listeden düşürür. */
export function movePowerUps(powerUps: readonly PowerUp[], dt: number, maxY: number): PowerUp[] {
  return powerUps
    .map((powerUp) => ({ ...powerUp, y: powerUp.y + POWER_UP_FALL_SPEED_PX_PER_SEC * dt }))
    .filter((powerUp) => powerUp.y <= maxY);
}

/** Düşman mermilerini aşağı hareket ettirir; oynanabilir alanın altına geçeni listeden düşürür. */
export function moveEnemyBullets(
  enemyBullets: readonly EnemyBullet[],
  dt: number,
  maxY: number,
): EnemyBullet[] {
  return enemyBullets
    .map((bullet) => ({ ...bullet, y: bullet.y + ENEMY_BULLET_SPEED_PX_PER_SEC * dt }))
    .filter((bullet) => bullet.y <= maxY);
}
