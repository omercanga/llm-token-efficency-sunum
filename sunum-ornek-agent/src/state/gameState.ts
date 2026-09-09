import { type Star, createStarfield, updateStarfield } from '../systems/starfield';
import { type Player, createPlayer } from '../entities/player';
import type { Bullet } from '../entities/bullet';
import type { Enemy } from '../entities/enemy';
import type { EnemyBullet } from '../entities/enemyBullet';
import { INSTANT_POWER_UP_KINDS, type PowerUp } from '../entities/powerUp';
import { type Particle, createExplosion, updateParticles } from '../systems/particles';
import {
  type PlayAreaBounds,
  createPlayAreaBounds,
  moveBullets,
  moveEnemies,
  moveEnemyBullets,
  movePlayer,
  movePowerUps,
} from '../systems/movement';
import { applyBuff, consumeBuffCharge, tickCooldown, tryFireBullet } from '../systems/shooting';
import { detectCollisions, detectEnemyBulletHits, detectPowerUpPickup } from '../systems/collision';
import { applyScoring } from '../systems/scoring';
import { maybeDropPowerUps } from '../systems/powerUpSpawn';
import { tickEnemyFiring } from '../systems/enemyFiring';
import {
  INITIAL_SPAWN_STATE,
  type SpawnState,
  type WaveDefinition,
  difficultyMultiplier,
  spawnEnemies,
} from '../systems/spawn';
import type { InputSnapshot } from '../engine/input';
import { PLAYER_HEIGHT, PLAYER_WIDTH, STARTING_LIVES } from '../config/constants';
import wavesData from '../data/waves.json';

// waves.json'daki `kind` alanı JSON import ile geniş `string` olarak çıkarımlanır;
// veri dosyasının kendi biçimine (EnemyKind birleşimi) güvenerek daraltıyoruz.
const WAVES: readonly WaveDefinition[] = wavesData as unknown as readonly WaveDefinition[];

export type GameStatus = 'playing' | 'gameOver';

/**
 * Bu adımda gerçekleşen, yan etkisi olan (ses vb.) olaylar. `update` saf
 * kalır: olayları yalnızca *bildirir*, kendisi hiçbir DOM/Audio API'sine
 * dokunmaz — bunları tüketmek `ui/`/`engine` katmanının sorumluluğudur.
 */
export type GameEvent =
  | { readonly type: 'bulletFired' }
  | { readonly type: 'enemyFire' }
  | { readonly type: 'enemyDestroyed'; readonly scoreValue: number }
  | { readonly type: 'playerHit' }
  | { readonly type: 'powerUpCollected' }
  | { readonly type: 'levelUp'; readonly level: number }
  | { readonly type: 'gameOver' };

/**
 * Oyunun tüm durumu — immutable. Her sistem bu tipten yeni bir kopya üretir,
 * mevcut olanı asla mutasyona uğratmaz (bkz. docs/adr/0002-state-management.md).
 */
export interface GameState {
  readonly status: GameStatus;
  readonly stars: readonly Star[];
  readonly player: Player;
  readonly bullets: readonly Bullet[];
  readonly enemies: readonly Enemy[];
  readonly enemyBullets: readonly EnemyBullet[];
  readonly powerUps: readonly PowerUp[];
  readonly particles: readonly Particle[];
  readonly score: number;
  readonly lives: number;
  readonly nextBulletId: number;
  readonly nextPowerUpId: number;
  readonly nextEnemyBulletId: number;
  readonly spawnState: SpawnState;
  /** Yalnızca bu adımda üretilen olaylar; bir sonraki adımda sıfırlanır. */
  readonly events: readonly GameEvent[];
}

const STAR_COUNT = 60;
const NO_EVENTS: readonly GameEvent[] = [];

export function createInitialGameState(width: number, height: number): GameState {
  const bounds = createPlayAreaBounds(width, height, PLAYER_WIDTH, PLAYER_HEIGHT);
  return {
    status: 'playing',
    stars: createStarfield(STAR_COUNT, width, height),
    player: createPlayer((bounds.minX + bounds.maxX) / 2, bounds.maxY),
    bullets: [],
    enemies: [],
    enemyBullets: [],
    powerUps: [],
    particles: [],
    score: 0,
    lives: STARTING_LIVES,
    nextBulletId: 1,
    nextPowerUpId: 1,
    nextEnemyBulletId: 1,
    spawnState: INITIAL_SPAWN_STATE,
    events: NO_EVENTS,
  };
}

/**
 * Tek bir sabit zaman adımı kadar durumu ileri alan saf fonksiyon. Alt
 * sistemler sırayla çağrılır: move → collision → spawn → scoring (bkz.
 * docs/adr/0002-state-management.md). `waves` ve `random`, testlerde sahte
 * dalga tanımları/deterministik rastgelelikle değiştirilebilsin diye
 * enjekte edilebilir parametrelerdir.
 */
export function updateGameState(
  state: GameState,
  input: InputSnapshot,
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
  waves: readonly WaveDefinition[] = WAVES,
  random: () => number = Math.random,
): GameState {
  if (state.status === 'gameOver') {
    return state.events.length > 0 ? { ...state, events: NO_EVENTS } : state;
  }

  const bounds: PlayAreaBounds = createPlayAreaBounds(
    canvasWidth,
    canvasHeight,
    state.player.width,
    state.player.height,
  );

  const movedPlayer = movePlayer(state.player, input, dt, bounds);
  const cooledPlayer = tickCooldown(movedPlayer, dt);
  const fireResult = tryFireBullet(cooledPlayer, input, state.nextBulletId);

  const bulletsAfterMove = moveBullets([...state.bullets, ...fireResult.bullets], dt);
  const enemiesAfterMove = moveEnemies(state.enemies, dt, canvasHeight, movedPlayer.x);
  const powerUpsAfterMove = movePowerUps(state.powerUps, dt, canvasHeight);
  const enemyBulletsAfterMove = moveEnemyBullets(state.enemyBullets, dt, canvasHeight);

  const collisionResult = detectCollisions(bulletsAfterMove, enemiesAfterMove, fireResult.player);
  const pickupResult = detectPowerUpPickup(powerUpsAfterMove, fireResult.player);
  const enemyBulletHitResult = detectEnemyBulletHits(enemyBulletsAfterMove, fireResult.player);
  const hasShield = fireResult.player.activeBuff?.kind === 'shield';
  const totalPlayerHits = collisionResult.playerHits + enemyBulletHitResult.playerHits;

  // Shield mühimmatı yalnızca isabet alınca tükenir (ateşte değil, bkz. systems/shooting.ts).
  const playerAfterShield =
    hasShield && totalPlayerHits > 0
      ? consumeBuffCharge(fireResult.player, totalPlayerHits)
      : fireResult.player;

  const playerAfterPickup = pickupResult.collectedPowerUps.reduce(
    (player, powerUp) =>
      INSTANT_POWER_UP_KINDS.has(powerUp.kind) ? player : applyBuff(player, powerUp.kind),
    playerAfterShield,
  );
  const extraLivesGained = pickupResult.collectedPowerUps.filter(
    (powerUp) => powerUp.kind === 'extraLife',
  ).length;

  const spawnResult = spawnEnemies(
    waves,
    state.spawnState,
    dt,
    collisionResult.survivingEnemies.length,
  );
  const powerUpDropResult = maybeDropPowerUps(
    collisionResult.destroyedEnemies,
    state.nextPowerUpId,
    random,
  );
  const difficulty = difficultyMultiplier(state.spawnState.waveIndex, waves.length || 1);
  const firingResult = tickEnemyFiring(
    collisionResult.survivingEnemies,
    dt,
    state.nextEnemyBulletId,
    difficulty,
    random,
  );

  const newExplosionParticles = collisionResult.destroyedEnemies.flatMap((enemy) =>
    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, undefined, random),
  );
  const playerHitParticles =
    totalPlayerHits > 0
      ? createExplosion(
          fireResult.player.x + fireResult.player.width / 2,
          fireResult.player.y + fireResult.player.height / 2,
          undefined,
          random,
        )
      : [];

  const newScore = applyScoring(state.score, collisionResult.destroyedEnemies);
  const newLives = state.lives - (hasShield ? 0 : totalPlayerHits) + extraLivesGained;
  const newStatus = newLives <= 0 ? 'gameOver' : 'playing';
  const leveledUp =
    newStatus === 'playing' && spawnResult.spawnState.waveIndex > state.spawnState.waveIndex;
  const newLevel = spawnResult.spawnState.waveIndex + 1;

  const events: GameEvent[] = [];
  if (fireResult.bullets.length > 0) {
    events.push({ type: 'bulletFired' });
  }
  if (firingResult.newBullets.length > 0) {
    events.push({ type: 'enemyFire' });
  }
  for (const enemy of collisionResult.destroyedEnemies) {
    events.push({ type: 'enemyDestroyed', scoreValue: enemy.scoreValue });
  }
  if (totalPlayerHits > 0) {
    events.push({ type: 'playerHit' });
  }
  if (pickupResult.collectedPowerUps.length > 0) {
    events.push({ type: 'powerUpCollected' });
  }
  if (leveledUp) {
    events.push({ type: 'levelUp', level: newLevel });
  }
  if (newStatus === 'gameOver') {
    events.push({ type: 'gameOver' });
  }

  return {
    ...state,
    stars: updateStarfield(state.stars, dt, canvasHeight),
    player: playerAfterPickup,
    bullets: collisionResult.survivingBullets,
    enemies: [...firingResult.enemies, ...spawnResult.newEnemies],
    enemyBullets: [...enemyBulletHitResult.survivingEnemyBullets, ...firingResult.newBullets],
    powerUps: [...pickupResult.survivingPowerUps, ...powerUpDropResult.newPowerUps],
    particles: updateParticles(
      [...state.particles, ...newExplosionParticles, ...playerHitParticles],
      dt,
    ),
    score: newScore,
    lives: newLives,
    nextBulletId: fireResult.nextBulletId,
    nextPowerUpId: powerUpDropResult.nextPowerUpId,
    nextEnemyBulletId: firingResult.nextEnemyBulletId,
    spawnState: spawnResult.spawnState,
    status: newStatus,
    events,
  };
}
