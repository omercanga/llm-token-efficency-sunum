export interface FixedTimestepResult<TState> {
  readonly state: TState;
  readonly accumulatedSeconds: number;
  readonly steps: number;
}

/**
 * Değişken frame süresini sabit adımlı simülasyon adımlarına böler.
 * `frameDeltaSeconds`, `maxDeltaSeconds` ile sınırlanır (sekme/donma sonrası
 * "spiral of death" oluşmaması için). Kalan süre bir sonraki çağrıya taşınır.
 */
export function advanceFixedTimestep<TState>(
  state: TState,
  accumulatedSeconds: number,
  frameDeltaSeconds: number,
  timestepSeconds: number,
  maxDeltaSeconds: number,
  step: (state: TState) => TState,
): FixedTimestepResult<TState> {
  const clampedDelta = Math.min(Math.max(frameDeltaSeconds, 0), maxDeltaSeconds);
  let remaining = accumulatedSeconds + clampedDelta;
  let nextState = state;
  let steps = 0;

  while (remaining >= timestepSeconds) {
    nextState = step(nextState);
    remaining -= timestepSeconds;
    steps += 1;
  }

  return { state: nextState, accumulatedSeconds: remaining, steps };
}
