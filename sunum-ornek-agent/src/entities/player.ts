import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../config/constants';
import type { PowerUpKind } from './powerUp';

export interface PlayerBuff {
  readonly kind: PowerUpKind;
  /** Kalan "mühimmat": silah buff'larında ateş başına, shield'da isabet başına 1 azalır. */
  readonly remainingCharges: number;
}

export interface Player {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Bir sonraki ateşe kadar kalan süre (saniye); 0 ise ateş edilebilir. */
  readonly cooldownRemainingSeconds: number;
  /** Bir power-up ile alınan geçici avantaj; mühimmatı bitince `null` olur. */
  readonly activeBuff: PlayerBuff | null;
}

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    cooldownRemainingSeconds: 0,
    activeBuff: null,
  };
}
