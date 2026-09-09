import { advanceFixedTimestep } from './fixedTimestep';

export interface GameLoopOptions<TState> {
  readonly initialState: TState;
  readonly timestepSeconds: number;
  readonly maxDeltaSeconds: number;
  readonly step: (state: TState) => TState;
  readonly render: (state: TState) => void;
  readonly now?: () => number;
  readonly requestFrame?: (callback: (time: number) => void) => number;
  readonly cancelFrame?: (handle: number) => void;
}

export interface GameLoopHandle<TState> {
  stop(): void;
  /** Döngüyü durdurmadan durumu sıfırlar (ör. "Tekrar Oyna") — biriken zamanı da temizler. */
  reset(newState: TState): void;
}

/**
 * requestAnimationFrame üzerinde sabit zaman adımlı bir döngü kurar.
 * Zamanlama kaynakları (`now`/`requestFrame`/`cancelFrame`) enjekte edilebilir
 * olduğundan bu fonksiyon tarayıcı olmadan da test edilebilir.
 */
export function startGameLoop<TState>(options: GameLoopOptions<TState>): GameLoopHandle<TState> {
  const now = options.now ?? (() => performance.now());
  const requestFrame = options.requestFrame ?? ((callback) => requestAnimationFrame(callback));
  const cancelFrame = options.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));

  let state = options.initialState;
  let accumulatedSeconds = 0;
  let lastTime = now();
  let frameHandle = 0;
  let stopped = false;

  const frame = (time: number): void => {
    if (stopped) return;

    const frameDeltaSeconds = (time - lastTime) / 1000;
    lastTime = time;

    const result = advanceFixedTimestep(
      state,
      accumulatedSeconds,
      frameDeltaSeconds,
      options.timestepSeconds,
      options.maxDeltaSeconds,
      options.step,
    );
    state = result.state;
    accumulatedSeconds = result.accumulatedSeconds;

    options.render(state);
    frameHandle = requestFrame(frame);
  };

  frameHandle = requestFrame(frame);

  return {
    stop(): void {
      stopped = true;
      cancelFrame(frameHandle);
    },
    reset(newState: TState): void {
      state = newState;
      accumulatedSeconds = 0;
      lastTime = now();
    },
  };
}
