import {
  BOSS_ENEMY_HP,
  BOSS_HEIGHT,
  BOSS_WIDTH,
  DEFAULT_ENEMY_SCORE_VALUE,
  ENEMY_FIRE_COOLDOWN_MIN_SECONDS,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  TANK_ENEMY_HP,
} from '../config/constants';

export type EnemyKind = 'straight' | 'zigzag' | 'tank' | 'diver' | 'boss';

/** Bu türler oyuncuya doğru ateş edebilir (bkz. systems/enemyFiring.ts); 'straight'/'diver' etmez. */
export const FIRING_ENEMY_KINDS: ReadonlySet<EnemyKind> = new Set(['zigzag', 'tank', 'boss']);

export interface Enemy {
  readonly id: number;
  readonly x: number;
  /** Zigzag hareketinin merkez ekseni (spawn anındaki x). */
  readonly spawnX: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly speedPxPerSec: number;
  readonly scoreValue: number;
  readonly kind: EnemyKind;
  /** Kalan can; 0'a düşünce düşman yok edilir. */
  readonly hp: number;
  /** Spawn'dan bu yana geçen süre (saniye) — zigzag fazı için kullanılır. */
  readonly ageSeconds: number;
  /** Bir sonraki ateşe kadar kalan süre (saniye); yalnızca FIRING_ENEMY_KINDS için anlamlıdır. */
  readonly fireCooldownRemainingSeconds: number;
}

function hpForKind(kind: EnemyKind): number {
  if (kind === 'tank') return TANK_ENEMY_HP;
  if (kind === 'boss') return BOSS_ENEMY_HP;
  return 1;
}

function sizeForKind(kind: EnemyKind): { width: number; height: number } {
  if (kind === 'boss') {
    return { width: BOSS_WIDTH, height: BOSS_HEIGHT };
  }
  return { width: ENEMY_WIDTH, height: ENEMY_HEIGHT };
}

export function createEnemy(
  id: number,
  x: number,
  y: number,
  speedPxPerSec: number,
  scoreValue: number = DEFAULT_ENEMY_SCORE_VALUE,
  kind: EnemyKind = 'straight',
): Enemy {
  const { width, height } = sizeForKind(kind);
  return {
    id,
    x,
    spawnX: x,
    y,
    width,
    height,
    speedPxPerSec,
    scoreValue,
    kind,
    hp: hpForKind(kind),
    ageSeconds: 0,
    fireCooldownRemainingSeconds: ENEMY_FIRE_COOLDOWN_MIN_SECONDS,
  };
}
