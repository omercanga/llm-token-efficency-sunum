import { type PowerUp, type PowerUpKind, createPowerUp } from '../entities/powerUp';
import type { Enemy } from '../entities/enemy';
import { POWER_UP_DROP_CHANCE, POWER_UP_WIDTH } from '../config/constants';

export interface PowerUpSpawnResult {
  readonly newPowerUps: readonly PowerUp[];
  readonly nextPowerUpId: number;
}

/** Kümülatif ağırlıklar toplamı 1 olmalıdır. `extraLife` bilinçli olarak en nadir olanıdır. */
const POWER_UP_KIND_WEIGHTS: ReadonlyArray<{
  readonly kind: PowerUpKind;
  readonly weight: number;
}> = [
  { kind: 'rapidFire', weight: 0.3 },
  { kind: 'multiShot', weight: 0.3 },
  { kind: 'pierce', weight: 0.2 },
  { kind: 'shield', weight: 0.15 },
  { kind: 'extraLife', weight: 0.05 },
];

function pickPowerUpKind(random: () => number): PowerUpKind {
  const roll = random();
  let cumulative = 0;
  // Ağırlıklar tam olarak 1'e toplandığından (bkz. yukarısı), roll [0,1) için
  // bir eşleşme her zaman bulunur.
  const match = POWER_UP_KIND_WEIGHTS.find((entry) => {
    cumulative += entry.weight;
    return roll < cumulative;
  });
  return match!.kind;
}

/**
 * Yok edilen düşmanlardan rastgele power-up düşürür. Saf fonksiyon:
 * `random` enjekte edilebilir (deterministik test için), varsayılan `Math.random`.
 */
export function maybeDropPowerUps(
  destroyedEnemies: readonly Enemy[],
  nextPowerUpId: number,
  random: () => number = Math.random,
): PowerUpSpawnResult {
  const newPowerUps: PowerUp[] = [];
  let id = nextPowerUpId;

  for (const enemy of destroyedEnemies) {
    if (random() >= POWER_UP_DROP_CHANCE) {
      continue;
    }
    const kind = pickPowerUpKind(random);
    newPowerUps.push(
      createPowerUp(id, enemy.x + enemy.width / 2 - POWER_UP_WIDTH / 2, enemy.y, kind),
    );
    id += 1;
  }

  return { newPowerUps, nextPowerUpId: id };
}
