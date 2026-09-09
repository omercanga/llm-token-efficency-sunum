import { describe, expect, it } from 'vitest';
import { screenShakeOffset, tickScreenShake, triggerScreenShake } from './screenShake';

describe('triggerScreenShake', () => {
  it('verilen genlik ve süreyle bir sarsıntı durumu üretir', () => {
    expect(triggerScreenShake(5, 200)).toEqual({ magnitudePx: 5, remainingMs: 200 });
  });
});

describe('tickScreenShake', () => {
  it('durum yoksa null döner', () => {
    expect(tickScreenShake(null, 16)).toBeNull();
  });

  it('kalan süreyi azaltır', () => {
    const state = triggerScreenShake(5, 200);

    const result = tickScreenShake(state, 50);

    expect(result).toEqual({ magnitudePx: 5, remainingMs: 150 });
  });

  it('süre dolunca null döner', () => {
    const state = triggerScreenShake(5, 50);

    const result = tickScreenShake(state, 100);

    expect(result).toBeNull();
  });
});

describe('screenShakeOffset', () => {
  it('durum yoksa (0, 0) döner', () => {
    expect(screenShakeOffset(null)).toEqual({ x: 0, y: 0 });
  });

  it('genliği aşmayan bir ofset üretir', () => {
    const state = triggerScreenShake(5, 200);

    const offset = screenShakeOffset(state, () => 1);

    expect(Math.abs(offset.x)).toBeLessThanOrEqual(5);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(5);
  });

  it('random 0.5 iken ofset (0, 0) olur (merkez)', () => {
    const state = triggerScreenShake(5, 200);

    const offset = screenShakeOffset(state, () => 0.5);

    expect(offset).toEqual({ x: 0, y: 0 });
  });
});
