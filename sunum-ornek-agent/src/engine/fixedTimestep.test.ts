import { describe, expect, it } from 'vitest';
import { advanceFixedTimestep } from './fixedTimestep';

describe('advanceFixedTimestep', () => {
  const timestep = 1 / 60;
  const maxDelta = 0.25;

  it('bir tam adımlık delta için step fonksiyonunu bir kez çağırır', () => {
    const step = (n: number): number => n + 1;

    const result = advanceFixedTimestep(0, 0, timestep, timestep, maxDelta, step);

    expect(result.steps).toBe(1);
    expect(result.state).toBe(1);
    expect(result.accumulatedSeconds).toBeCloseTo(0, 10);
  });

  it('yarım adımlık delta için hiç adım atmaz, kalanı biriktirir', () => {
    const step = (n: number): number => n + 1;

    const result = advanceFixedTimestep(0, 0, timestep / 2, timestep, maxDelta, step);

    expect(result.steps).toBe(0);
    expect(result.state).toBe(0);
    expect(result.accumulatedSeconds).toBeCloseTo(timestep / 2, 10);
  });

  it('büyük bir delta için birden fazla adım atar', () => {
    const step = (n: number): number => n + 1;

    const result = advanceFixedTimestep(0, 0, timestep * 3.5, timestep, maxDelta, step);

    expect(result.steps).toBe(3);
    expect(result.state).toBe(3);
    expect(result.accumulatedSeconds).toBeCloseTo(timestep * 0.5, 10);
  });

  it('önceki birikmiş süreyi hesaba katar', () => {
    const step = (n: number): number => n + 1;

    const result = advanceFixedTimestep(
      0,
      timestep * 0.9,
      timestep * 0.2,
      timestep,
      maxDelta,
      step,
    );

    expect(result.steps).toBe(1);
  });

  it('aşırı büyük bir delta değerini maxDeltaSeconds ile sınırlar ("spiral of death" önlemi)', () => {
    const step = (n: number): number => n + 1;
    const hugeDelta = 10; // ör. sekme sonrası

    const result = advanceFixedTimestep(0, 0, hugeDelta, timestep, maxDelta, step);

    const expectedSteps = Math.floor(maxDelta / timestep);
    expect(result.steps).toBe(expectedSteps);
  });

  it('negatif delta değerini sıfıra sabitler', () => {
    const step = (n: number): number => n + 1;

    const result = advanceFixedTimestep(0, 0, -5, timestep, maxDelta, step);

    expect(result.steps).toBe(0);
    expect(result.accumulatedSeconds).toBe(0);
  });
});
