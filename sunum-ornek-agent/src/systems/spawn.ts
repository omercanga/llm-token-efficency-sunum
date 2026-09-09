import { type Enemy, type EnemyKind, createEnemy } from '../entities/enemy';
import { DIFFICULTY_STEP_PER_CYCLE, ENEMY_HEIGHT } from '../config/constants';

export interface EnemySpawnDefinition {
  readonly atSeconds: number;
  readonly x: number;
  readonly speedPxPerSec: number;
  readonly scoreValue: number;
  readonly kind?: EnemyKind;
}

export interface WaveDefinition {
  readonly spawns: readonly EnemySpawnDefinition[];
}

export interface SpawnState {
  readonly waveIndex: number;
  readonly waveElapsedSeconds: number;
  readonly nextEnemyId: number;
}

export interface SpawnResult {
  readonly newEnemies: readonly Enemy[];
  readonly spawnState: SpawnState;
}

export const INITIAL_SPAWN_STATE: SpawnState = {
  waveIndex: 0,
  waveElapsedSeconds: 0,
  nextEnemyId: 1,
};

/** Bir sonraki dalgaya geçmeden önce, son düşman öldükten sonra beklenecek tampon süre. */
const WAVE_CLEAR_BUFFER_SECONDS = 1.5;

function waveDurationSeconds(wave: WaveDefinition): number {
  return wave.spawns.reduce((max, spawn) => Math.max(max, spawn.atSeconds), 0);
}

/**
 * Tüm dalgalar bir kez döngülendiğinde (bir "tur") zorluk artışı uygular.
 * Sonsuz modda oyun hiç bitmediği için düşmanlar turdan tura hızlanır/daha
 * çok puan eder.
 */
export function difficultyMultiplier(waveIndex: number, waveCount: number): number {
  const completedCycles = Math.floor(waveIndex / waveCount);
  return 1 + completedCycles * DIFFICULTY_STEP_PER_CYCLE;
}

/**
 * Veri-güdümlü dalga tanımına (`waves.json`) göre zamanı gelen düşmanları
 * üretir ve dalganın ne zaman ilerleyeceğine karar verir. Saf fonksiyon.
 * `remainingEnemiesOnScreen`, bu adımdan önce ekranda kalan (bu frame'de
 * henüz eklenmemiş) düşman sayısıdır.
 */
export function spawnEnemies(
  waves: readonly WaveDefinition[],
  spawnState: SpawnState,
  dt: number,
  remainingEnemiesOnScreen: number,
): SpawnResult {
  if (waves.length === 0) {
    return { newEnemies: [], spawnState };
  }

  const wave = waves[spawnState.waveIndex % waves.length] as WaveDefinition;
  const previousElapsed = spawnState.waveElapsedSeconds;
  const nextElapsed = previousElapsed + dt;

  // Yarı açık aralık [previousElapsed, nextElapsed): atSeconds=0 olan spawn'ın
  // ilk adımda kaçırılmamasını, sınırdaki bir spawn'ın da iki kez üretilmemesini sağlar.
  const dueSpawns = wave.spawns.filter(
    (spawn) => spawn.atSeconds >= previousElapsed && spawn.atSeconds < nextElapsed,
  );

  const multiplier = difficultyMultiplier(spawnState.waveIndex, waves.length);
  let nextEnemyId = spawnState.nextEnemyId;
  const newEnemies: Enemy[] = [];
  for (const spawn of dueSpawns) {
    newEnemies.push(
      createEnemy(
        nextEnemyId,
        spawn.x,
        -ENEMY_HEIGHT,
        spawn.speedPxPerSec * multiplier,
        Math.round(spawn.scoreValue * multiplier),
        spawn.kind ?? 'straight',
      ),
    );
    nextEnemyId += 1;
  }

  const waveSpawningFinished = nextElapsed >= waveDurationSeconds(wave) + WAVE_CLEAR_BUFFER_SECONDS;
  const shouldAdvanceWave =
    waveSpawningFinished && remainingEnemiesOnScreen === 0 && newEnemies.length === 0;

  return {
    newEnemies,
    spawnState: {
      waveIndex: shouldAdvanceWave ? spawnState.waveIndex + 1 : spawnState.waveIndex,
      waveElapsedSeconds: shouldAdvanceWave ? 0 : nextElapsed,
      nextEnemyId,
    },
  };
}
