export interface Star {
  readonly x: number;
  readonly y: number;
  readonly speed: number;
  readonly size: number;
}

const MIN_STAR_SPEED = 20;
const STAR_SPEED_RANGE = 60;
const MAX_STAR_SIZE = 2;

/** Retro paralaks arka plan için rastgele bir yıldız alanı üretir. `random` enjekte edilebilir (deterministik test için). */
export function createStarfield(
  count: number,
  width: number,
  height: number,
  random: () => number = Math.random,
): Star[] {
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    speed: MIN_STAR_SPEED + random() * STAR_SPEED_RANGE,
    size: 1 + Math.floor(random() * MAX_STAR_SIZE),
  }));
}

/** Yıldızları aşağı kaydırır; ekranın altından çıkanı üstten yeniden başlatır (sonsuz kayma illüzyonu). */
export function updateStarfield(stars: readonly Star[], dt: number, height: number): Star[] {
  return stars.map((star) => {
    const y = star.y + star.speed * dt;
    return y > height ? { ...star, y: y - height } : { ...star, y };
  });
}
