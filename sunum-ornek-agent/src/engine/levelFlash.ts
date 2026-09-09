export interface LevelFlashState {
  readonly hue: number;
  readonly totalMs: number;
  readonly remainingMs: number;
}

/** Seviye numarasına göre döngüsel ama her seviyede belirgin biçimde farklı bir renk (derece) üretir. */
export function hueForLevel(level: number): number {
  const HUE_STEP_DEGREES = 47;
  const FULL_TURN_DEGREES = 360;
  return (level * HUE_STEP_DEGREES) % FULL_TURN_DEGREES;
}

/** Yeni bir seviye atlama flaşı başlatır (önceki flaşın üzerine yazar). */
export function triggerLevelFlash(hue: number, durationMs: number): LevelFlashState {
  return { hue, totalMs: durationMs, remainingMs: durationMs };
}

/** Geçen gerçek zamana göre flaşın kalan süresini azaltır; süre dolunca `null` döner. */
export function tickLevelFlash(
  state: LevelFlashState | null,
  deltaMs: number,
): LevelFlashState | null {
  if (!state) {
    return null;
  }
  const remainingMs = state.remainingMs - deltaMs;
  return remainingMs > 0 ? { ...state, remainingMs } : null;
}

/** Flaş aktifken zamanla sönen bir opaklık üretir (0..maxAlpha); aktif değilse 0. */
export function levelFlashAlpha(state: LevelFlashState | null, maxAlpha: number): number {
  if (!state) {
    return 0;
  }
  return (state.remainingMs / state.totalMs) * maxAlpha;
}
