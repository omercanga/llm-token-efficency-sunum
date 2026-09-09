export interface ScreenShakeState {
  readonly magnitudePx: number;
  readonly remainingMs: number;
}

export interface ScreenShakeOffset {
  readonly x: number;
  readonly y: number;
}

/** Yeni bir ekran sarsıntısı başlatır (önceki sarsıntının üzerine yazar). */
export function triggerScreenShake(magnitudePx: number, durationMs: number): ScreenShakeState {
  return { magnitudePx, remainingMs: durationMs };
}

/** Geçen gerçek zamana göre sarsıntı süresini azaltır; süre dolunca `null` döner. */
export function tickScreenShake(
  state: ScreenShakeState | null,
  deltaMs: number,
): ScreenShakeState | null {
  if (!state) {
    return null;
  }
  const remainingMs = state.remainingMs - deltaMs;
  return remainingMs > 0 ? { ...state, remainingMs } : null;
}

/** Sarsıntı aktifken rastgele küçük bir x/y kayması üretir; aktif değilse (0, 0). */
export function screenShakeOffset(
  state: ScreenShakeState | null,
  random: () => number = Math.random,
): ScreenShakeOffset {
  if (!state) {
    return { x: 0, y: 0 };
  }
  return {
    x: (random() - 0.5) * 2 * state.magnitudePx,
    y: (random() - 0.5) * 2 * state.magnitudePx,
  };
}
