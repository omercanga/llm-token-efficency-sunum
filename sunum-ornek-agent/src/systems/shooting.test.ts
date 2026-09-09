import { describe, expect, it } from 'vitest';
import {
  applyBuff,
  consumeBuffCharge,
  maxChargesForBuffKind,
  tickCooldown,
  tryFireBullet,
} from './shooting';
import { createPlayer } from '../entities/player';
import {
  FIRE_COOLDOWN_SECONDS,
  MULTI_SHOT_CHARGES,
  RAPID_FIRE_CHARGES,
  RAPID_FIRE_COOLDOWN_SECONDS,
} from '../config/constants';
import type { InputSnapshot } from '../engine/input';

const noInput: InputSnapshot = { up: false, down: false, left: false, right: false, fire: false };

describe('tryFireBullet', () => {
  it('ateş tuşu basılı değilse mermi üretmez', () => {
    const player = createPlayer(100, 500);

    const result = tryFireBullet(player, noInput, 1);

    expect(result.bullets).toHaveLength(0);
    expect(result.nextBulletId).toBe(1);
  });

  it('ateş tuşu basılıysa ve bekleme süresi dolmuşsa tek mermi üretir ve normal cooldown başlatır', () => {
    const player = createPlayer(100, 500);

    const result = tryFireBullet(player, { ...noInput, fire: true }, 1);

    expect(result.bullets).toHaveLength(1);
    expect(result.bullets[0]?.id).toBe(1);
    expect(result.bullets[0]?.piercing).toBe(false);
    expect(result.nextBulletId).toBe(2);
    expect(result.player.cooldownRemainingSeconds).toBe(FIRE_COOLDOWN_SECONDS);
  });

  it('bekleme süresi dolmamışsa ateş tuşu basılı olsa bile mermi üretmez', () => {
    const player = { ...createPlayer(100, 500), cooldownRemainingSeconds: 0.1 };

    const result = tryFireBullet(player, { ...noInput, fire: true }, 1);

    expect(result.bullets).toHaveLength(0);
    expect(result.nextBulletId).toBe(1);
  });

  it("rapidFire buff'ı aktifken daha kısa bir cooldown kullanır ve ateşte 1 mühimmat tüketir", () => {
    const player = applyBuff(createPlayer(100, 500), 'rapidFire');

    const result = tryFireBullet(player, { ...noInput, fire: true }, 1);

    expect(result.bullets).toHaveLength(1);
    expect(result.player.cooldownRemainingSeconds).toBe(RAPID_FIRE_COOLDOWN_SECONDS);
    expect(result.player.activeBuff?.remainingCharges).toBe(RAPID_FIRE_CHARGES - 1);
  });

  it("multiShot buff'ı aktifken 3 mermi birden üretir ama yalnızca 1 mühimmat tüketir", () => {
    const player = applyBuff(createPlayer(100, 500), 'multiShot');

    const result = tryFireBullet(player, { ...noInput, fire: true }, 5);

    expect(result.bullets).toHaveLength(3);
    expect(result.bullets.map((b) => b.id)).toEqual([5, 6, 7]);
    expect(result.nextBulletId).toBe(8);
    expect(result.player.activeBuff?.remainingCharges).toBe(MULTI_SHOT_CHARGES - 1);
    // Ortadaki mermi oyuncunun merkezinde, yanlar simetrik ofsetli.
    const xs = result.bullets.map((b) => b.x).sort((a, b) => a - b);
    expect(xs[1]).toBeGreaterThan(xs[0]!);
    expect(xs[2]).toBeGreaterThan(xs[1]!);
  });

  it("pierce buff'ı aktifken delici (piercing) bir mermi üretir ve mühimmat tüketir", () => {
    const player = applyBuff(createPlayer(100, 500), 'pierce');

    const result = tryFireBullet(player, { ...noInput, fire: true }, 1);

    expect(result.bullets).toHaveLength(1);
    expect(result.bullets[0]?.piercing).toBe(true);
    expect(result.player.cooldownRemainingSeconds).toBe(FIRE_COOLDOWN_SECONDS);
    expect(result.player.activeBuff?.remainingCharges).toBe(maxChargesForBuffKind('pierce') - 1);
  });

  it('son mühimmatla ateş edince buff kalkar', () => {
    const player = {
      ...applyBuff(createPlayer(100, 500), 'rapidFire'),
      activeBuff: { kind: 'rapidFire' as const, remainingCharges: 1 },
    };

    const result = tryFireBullet(player, { ...noInput, fire: true }, 1);

    expect(result.bullets).toHaveLength(1);
    expect(result.player.activeBuff).toBeNull();
  });

  it("shield buff'ı ateşleme davranışını ve mühimmatını değiştirmez (yalnızca isabette tükenir)", () => {
    const player = applyBuff(createPlayer(100, 500), 'shield');

    const result = tryFireBullet(player, { ...noInput, fire: true }, 1);

    expect(result.bullets).toHaveLength(1);
    expect(result.bullets[0]?.piercing).toBe(false);
    expect(result.player.cooldownRemainingSeconds).toBe(FIRE_COOLDOWN_SECONDS);
    expect(result.player.activeBuff?.remainingCharges).toBe(maxChargesForBuffKind('shield'));
  });
});

describe('tickCooldown', () => {
  it('bekleme süresi sıfırsa değişmeden döner', () => {
    const player = createPlayer(100, 500);

    expect(tickCooldown(player, 1)).toBe(player);
  });

  it('bekleme süresini dt kadar azaltır, negatife düşürmez', () => {
    const player = { ...createPlayer(100, 500), cooldownRemainingSeconds: 0.1 };

    const result = tickCooldown(player, 1);

    expect(result.cooldownRemainingSeconds).toBe(0);
  });
});

describe('applyBuff', () => {
  it('oyuncuya belirtilen türde ve tam mühimmatlı bir buff uygular', () => {
    const player = applyBuff(createPlayer(100, 500), 'rapidFire');

    expect(player.activeBuff).toEqual({
      kind: 'rapidFire',
      remainingCharges: RAPID_FIRE_CHARGES,
    });
  });
});

describe('consumeBuffCharge', () => {
  it('buff yoksa değişmeden döner', () => {
    const player = createPlayer(100, 500);

    expect(consumeBuffCharge(player)).toBe(player);
  });

  it('mühimmatı belirtilen miktar kadar azaltır', () => {
    const player = applyBuff(createPlayer(100, 500), 'shield');

    const result = consumeBuffCharge(player, 1);

    expect(result.activeBuff?.remainingCharges).toBe(maxChargesForBuffKind('shield') - 1);
  });

  it('birden fazla miktar aynı anda tüketilebilir (ör. aynı karede birden fazla isabet)', () => {
    const player = applyBuff(createPlayer(100, 500), 'shield');

    const result = consumeBuffCharge(player, 2);

    expect(result.activeBuff?.remainingCharges).toBe(maxChargesForBuffKind('shield') - 2);
  });

  it('mühimmat biterse (0 veya altına düşerse) buff kaldırılır', () => {
    const player = {
      ...applyBuff(createPlayer(100, 500), 'shield'),
      activeBuff: { kind: 'shield' as const, remainingCharges: 1 },
    };

    const result = consumeBuffCharge(player, 1);

    expect(result.activeBuff).toBeNull();
  });
});

describe('maxChargesForBuffKind', () => {
  it('her silah/kalkan türü için pozitif bir mühimmat döner', () => {
    expect(maxChargesForBuffKind('rapidFire')).toBeGreaterThan(0);
    expect(maxChargesForBuffKind('multiShot')).toBeGreaterThan(0);
    expect(maxChargesForBuffKind('pierce')).toBeGreaterThan(0);
    expect(maxChargesForBuffKind('shield')).toBeGreaterThan(0);
  });
});
