import { describe, expect, it } from 'vitest';
import { drawLevelFlash, render } from './render';
import { createInitialGameState } from '../state/gameState';
import { createEnemy } from '../entities/enemy';
import { createEnemyBullet } from '../entities/enemyBullet';
import { createPowerUp } from '../entities/powerUp';
import { triggerLevelFlash } from './levelFlash';
import type { RenderContext } from './render';

function createFakeContext(): RenderContext & {
  fillRectCalls: Array<[number, number, number, number]>;
  fillCallCount: number;
  arcCallCount: number;
  strokeCallCount: number;
} {
  const fillRectCalls: Array<[number, number, number, number]> = [];
  let fillCallCount = 0;
  let arcCallCount = 0;
  let strokeCallCount = 0;

  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    shadowColor: '',
    shadowBlur: 0,
    globalAlpha: 1,
    fillRectCalls,
    get fillCallCount() {
      return fillCallCount;
    },
    get arcCallCount() {
      return arcCallCount;
    },
    get strokeCallCount() {
      return strokeCallCount;
    },
    fillRect(x, y, w, h) {
      fillRectCalls.push([x, y, w, h]);
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arc() {
      arcCallCount += 1;
    },
    closePath() {},
    fill() {
      fillCallCount += 1;
    },
    stroke() {
      strokeCallCount += 1;
    },
  };
}

describe('render', () => {
  it('arka planı ve her yıldızı fillRect ile, oyuncuyu vektör yol (fill) ile çizer', () => {
    const state = createInitialGameState(480, 640);
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    // 1 arka plan + yıldız sayısı kadar fillRect çağrısı (mermi/düşman/parçacık yok bu state'te)
    expect(ctx.fillRectCalls).toHaveLength(1 + state.stars.length);
    expect(ctx.fillRectCalls[0]).toEqual([0, 0, 480, 640]);
    // Oyuncu gemisi bir vektör yol (fill) ile çizilir.
    expect(ctx.fillCallCount).toBe(1);
  });

  it('her düşman için de bir vektör yol (fill) çağrısı yapar', () => {
    const base = createInitialGameState(480, 640);
    const state = {
      ...base,
      enemies: [createEnemy(1, 10, 10, 50), createEnemy(2, 50, 10, 50)],
    };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    // 1 oyuncu + 2 düşman = 3 fill() çağrısı
    expect(ctx.fillCallCount).toBe(3);
  });

  it("'tank' düşman ek bir vektör yol daha çizer (görsel ağırlık)", () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, enemies: [createEnemy(1, 10, 10, 50, 30, 'tank')] };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    // 1 oyuncu + 2 (tank'ın gövdesi + ek hat) = 3 fill() çağrısı
    expect(ctx.fillCallCount).toBe(3);
  });

  it.each(['straight', 'zigzag', 'diver', 'boss'] as const)(
    "'%s' düşman türü tek bir vektör yol (fill) ile çizilir",
    (kind) => {
      const base = createInitialGameState(480, 640);
      const state = { ...base, enemies: [createEnemy(1, 10, 10, 50, 10, kind)] };
      const ctx = createFakeContext();

      render(ctx, state, 480, 640);

      // 1 oyuncu + 1 düşman = 2 fill() çağrısı
      expect(ctx.fillCallCount).toBe(2);
    },
  );

  it('her power-up için bir vektör yol (fill) çağrısı yapar', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, powerUps: [createPowerUp(1, 10, 10, 'rapidFire')] };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    // 1 oyuncu + 1 power-up = 2 fill() çağrısı
    expect(ctx.fillCallCount).toBe(2);
  });

  it('shield power-up bir daire (arc + fill) olarak çizilir', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, powerUps: [createPowerUp(1, 10, 10, 'shield')] };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.arcCallCount).toBe(1);
    expect(ctx.fillCallCount).toBe(2);
  });

  it('extraLife power-up bir artı işareti (2 fillRect) olarak çizilir, fill() kullanmaz', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, powerUps: [createPowerUp(1, 10, 10, 'extraLife')] };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    // 1 arka plan + yıldızlar + 2 (artı işaretinin çubukları)
    expect(ctx.fillRectCalls).toHaveLength(1 + state.stars.length + 2);
    // Yalnızca oyuncu gemisi fill() kullanır.
    expect(ctx.fillCallCount).toBe(1);
  });

  it("oyuncunun aktif shield buff'ı varken etrafında bir halka (stroke) çizilir", () => {
    const base = createInitialGameState(480, 640);
    const state = {
      ...base,
      player: { ...base.player, activeBuff: { kind: 'shield' as const, remainingCharges: 3 } },
    };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.arcCallCount).toBe(1);
    expect(ctx.strokeCallCount).toBe(1);
  });

  it("shield buff'ı yokken halka çizilmez", () => {
    const state = createInitialGameState(480, 640);
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.arcCallCount).toBe(0);
    expect(ctx.strokeCallCount).toBe(0);
  });

  it('aktif bir buff varken geminin üzerinde mühimmat çubuğu (2 fillRect) çizilir', () => {
    const base = createInitialGameState(480, 640);
    const state = {
      ...base,
      player: { ...base.player, activeBuff: { kind: 'rapidFire' as const, remainingCharges: 10 } },
    };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    // 1 arka plan + yıldızlar + 2 (çubuğun arka planı + dolu kısmı)
    expect(ctx.fillRectCalls).toHaveLength(1 + state.stars.length + 2);
  });

  it('buff yokken mühimmat çubuğu çizilmez', () => {
    const state = createInitialGameState(480, 640);
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.fillRectCalls).toHaveLength(1 + state.stars.length);
  });

  it('her düşman mermisi için bir fillRect çağrısı yapar', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, enemyBullets: [createEnemyBullet(1, 10, 10)] };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.fillRectCalls).toHaveLength(1 + state.stars.length + 1);
  });

  it('her parçacık için bir fillRect çağrısı yapar', () => {
    const base = createInitialGameState(480, 640);
    const state = {
      ...base,
      particles: [{ x: 5, y: 5, velocityX: 0, velocityY: 0, ageSeconds: 0, lifeSeconds: 1 }],
    };
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.fillRectCalls).toHaveLength(1 + state.stars.length + 1);
  });

  it("render sonunda shadowBlur sıfırlanır ve globalAlpha 1'e döner", () => {
    const state = createInitialGameState(480, 640);
    const ctx = createFakeContext();

    render(ctx, state, 480, 640);

    expect(ctx.shadowBlur).toBe(0);
    expect(ctx.globalAlpha).toBe(1);
  });
});

describe('drawLevelFlash', () => {
  it('flaş yoksa (null) hiçbir şey çizmez', () => {
    const ctx = createFakeContext();

    drawLevelFlash(ctx, 480, 640, null);

    expect(ctx.fillRectCalls).toHaveLength(0);
  });

  it('flaş aktifken tüm ekranı kaplayan tek bir fillRect çağrısı yapar ve rengi seviyeye göre belirler', () => {
    const ctx = createFakeContext();
    const flash = triggerLevelFlash(120, 400);

    drawLevelFlash(ctx, 480, 640, flash);

    expect(ctx.fillRectCalls).toEqual([[0, 0, 480, 640]]);
    expect(ctx.fillStyle).toBe('hsl(120, 90%, 60%)');
  });

  it("çizim sonrasında globalAlpha 1'e geri döner", () => {
    const ctx = createFakeContext();
    const flash = triggerLevelFlash(120, 400);

    drawLevelFlash(ctx, 480, 640, flash);

    expect(ctx.globalAlpha).toBe(1);
  });
});
