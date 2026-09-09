import { ENEMY_BULLET_HEIGHT, ENEMY_BULLET_WIDTH } from '../config/constants';

export interface EnemyBullet {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function createEnemyBullet(id: number, x: number, y: number): EnemyBullet {
  return { id, x, y, width: ENEMY_BULLET_WIDTH, height: ENEMY_BULLET_HEIGHT };
}
