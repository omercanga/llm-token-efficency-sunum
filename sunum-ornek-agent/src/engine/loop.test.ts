import { describe, expect, it, vi } from 'vitest';
import { startGameLoop } from './loop';

describe('startGameLoop', () => {
  it("bir sonraki frame'i hemen zamanlar, henüz step'i çağırmaz", () => {
    const requestFrame = vi.fn((_cb: (t: number) => void) => 1);
    const step = vi.fn((n: number) => n + 1);
    const render = vi.fn();

    startGameLoop({
      initialState: 0,
      timestepSeconds: 1 / 60,
      maxDeltaSeconds: 0.25,
      step,
      render,
      now: () => 0,
      requestFrame,
      cancelFrame: vi.fn(),
    });

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(step).not.toHaveBeenCalled();
  });

  it('tam bir timestep kadar geçen sürede step ve render bir kez çağrılır', () => {
    const frames: Array<(t: number) => void> = [];
    const requestFrame = vi.fn((cb: (t: number) => void) => {
      frames.push(cb);
      return frames.length;
    });
    const step = vi.fn((n: number) => n + 1);
    const render = vi.fn();
    let time = 0;

    startGameLoop({
      initialState: 0,
      timestepSeconds: 1 / 60,
      maxDeltaSeconds: 0.25,
      step,
      render,
      now: () => time,
      requestFrame,
      cancelFrame: vi.fn(),
    });

    time = 1000 / 60;
    frames[0]?.(time);

    expect(step).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith(1);
  });

  it("stop() çağrıldığında cancelFrame çalışır ve sonraki frame'ler işlenmez", () => {
    const frames: Array<(t: number) => void> = [];
    const requestFrame = vi.fn((cb: (t: number) => void) => {
      frames.push(cb);
      return frames.length;
    });
    const cancelFrame = vi.fn();
    const step = vi.fn((n: number) => n + 1);
    const render = vi.fn();

    const handle = startGameLoop({
      initialState: 0,
      timestepSeconds: 1 / 60,
      maxDeltaSeconds: 0.25,
      step,
      render,
      now: () => 0,
      requestFrame,
      cancelFrame,
    });

    handle.stop();
    expect(cancelFrame).toHaveBeenCalledTimes(1);

    frames[0]?.(1000);
    expect(step).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });

  it('reset() durumu değiştirir ve biriken zamanı temizler ("Tekrar Oyna")', () => {
    const frames: Array<(t: number) => void> = [];
    const requestFrame = vi.fn((cb: (t: number) => void) => {
      frames.push(cb);
      return frames.length;
    });
    const step = vi.fn((n: number) => n + 1);
    const render = vi.fn();
    let time = 0;

    const handle = startGameLoop({
      initialState: 0,
      timestepSeconds: 1 / 60,
      maxDeltaSeconds: 0.25,
      step,
      render,
      now: () => time,
      requestFrame,
      cancelFrame: vi.fn(),
    });

    // Yarım bir timestep kadar biriktir (henüz step tetiklenmez).
    time = 1000 / 60 / 2;
    frames[0]?.(time);
    expect(step).not.toHaveBeenCalled();

    handle.reset(100);

    // reset sonrası aynı yarım timestep'lik delta tekrar step'i tetiklememeli
    // (biriken süre sıfırlandığı için); yeni bir tam timestep gerekir.
    time += 1000 / 60 / 2;
    frames[1]?.(time);
    expect(step).not.toHaveBeenCalled();

    time += 1000 / 60;
    frames[2]?.(time);
    expect(step).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith(101);
  });
});
