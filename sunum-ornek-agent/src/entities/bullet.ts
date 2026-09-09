import { BULLET_HEIGHT, BULLET_WIDTH } from '../config/constants';

export interface Bullet {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** 'pierce' buff'ıyla ateşlenmişse true; bu mermi bir düşmana çarpınca yok olmaz, yoluna devam eder. */
  readonly piercing: boolean;
}

export function createBullet(id: number, x: number, y: number, piercing = false): Bullet {
  return { id, x, y, width: BULLET_WIDTH, height: BULLET_HEIGHT, piercing };
}
