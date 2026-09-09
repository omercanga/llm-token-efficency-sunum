import { POWER_UP_HEIGHT, POWER_UP_WIDTH } from '../config/constants';

export type PowerUpKind = 'rapidFire' | 'multiShot' | 'pierce' | 'shield' | 'extraLife';

/** Bu türler geçici bir buff değil, alınır alınmaz tek seferlik bir etki uygular (bkz. state/gameState.ts). */
export const INSTANT_POWER_UP_KINDS: ReadonlySet<PowerUpKind> = new Set(['extraLife']);

export interface PowerUp {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly kind: PowerUpKind;
}

export function createPowerUp(id: number, x: number, y: number, kind: PowerUpKind): PowerUp {
  return { id, x, y, width: POWER_UP_WIDTH, height: POWER_UP_HEIGHT, kind };
}
