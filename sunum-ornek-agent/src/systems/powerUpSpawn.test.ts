import { describe, expect, it } from 'vitest';
import { maybeDropPowerUps } from './powerUpSpawn';
import { createEnemy } from '../entities/enemy';

describe('maybeDropPowerUps', () => {
  it('yok edilen düşman yoksa hiçbir şey düşürmez', () => {
    const result = maybeDropPowerUps([], 1, () => 0);

    expect(result.newPowerUps).toHaveLength(0);
    expect(result.nextPowerUpId).toBe(1);
  });

  it("random düşme eşiğinin altındaysa power-up düşürür ve id'yi artırır", () => {
    const enemy = createEnemy(1, 100, 200, 50);

    const result = maybeDropPowerUps([enemy], 5, () => 0);

    expect(result.newPowerUps).toHaveLength(1);
    expect(result.newPowerUps[0]?.id).toBe(5);
    expect(result.nextPowerUpId).toBe(6);
  });

  it('random düşme eşiğinin üstündeyse power-up düşürmez', () => {
    const enemy = createEnemy(1, 100, 200, 50);

    const result = maybeDropPowerUps([enemy], 5, () => 0.99);

    expect(result.newPowerUps).toHaveLength(0);
    expect(result.nextPowerUpId).toBe(5);
  });

  it('birden fazla düşman için bağımsız zar atar, yalnızca düşenler eklenir', () => {
    const enemyA = createEnemy(1, 0, 0, 50);
    const enemyB = createEnemy(2, 0, 0, 50);
    let call = 0;
    // İlk çağrı (drop kararı) düşürür, ikincisi (drop kararı) düşürmez, kind seçimleri de tüketilir.
    const random = () => {
      call += 1;
      return call === 1 ? 0 : 0.99;
    };

    const result = maybeDropPowerUps([enemyA, enemyB], 1, random);

    expect(result.newPowerUps).toHaveLength(1);
  });

  it('ağırlıklı tabloya göre her tür kendi aralığında seçilir', () => {
    const enemy = createEnemy(1, 100, 200, 50);
    // drop kararı için hep 0 (her zaman düşer); ikinci çağrı kind seçimi için kullanılır.
    const dropAndKindRoll = (kindRoll: number) => {
      let call = 0;
      return () => {
        call += 1;
        return call === 1 ? 0 : kindRoll;
      };
    };

    expect(maybeDropPowerUps([enemy], 1, dropAndKindRoll(0)).newPowerUps[0]?.kind).toBe(
      'rapidFire',
    );
    expect(maybeDropPowerUps([enemy], 1, dropAndKindRoll(0.35)).newPowerUps[0]?.kind).toBe(
      'multiShot',
    );
    expect(maybeDropPowerUps([enemy], 1, dropAndKindRoll(0.65)).newPowerUps[0]?.kind).toBe(
      'pierce',
    );
    expect(maybeDropPowerUps([enemy], 1, dropAndKindRoll(0.85)).newPowerUps[0]?.kind).toBe(
      'shield',
    );
    expect(maybeDropPowerUps([enemy], 1, dropAndKindRoll(0.97)).newPowerUps[0]?.kind).toBe(
      'extraLife',
    );
  });
});
