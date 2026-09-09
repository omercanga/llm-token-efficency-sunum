import { describe, expect, it } from 'vitest';
import { createInitialGameState, updateGameState } from './gameState';
import { createEnemy } from '../entities/enemy';
import { createEnemyBullet } from '../entities/enemyBullet';
import { createPowerUp } from '../entities/powerUp';
import { ENEMY_FIRE_COOLDOWN_MIN_SECONDS, STARTING_LIVES } from '../config/constants';
import type { InputSnapshot } from '../engine/input';
import type { WaveDefinition } from '../systems/spawn';

const noInput: InputSnapshot = { up: false, down: false, left: false, right: false, fire: false };
const noWaves: WaveDefinition[] = [];
/** Testlerde power-up düşmesini/kind seçimini bastırmak için: her zaman "düşmez" eşiği. */
const neverRandom = (): number => 0.999;

describe('createInitialGameState', () => {
  it('oyunu başlangıç değerleriyle başlatır', () => {
    const state = createInitialGameState(480, 640);

    expect(state.status).toBe('playing');
    expect(state.stars.length).toBeGreaterThan(0);
    expect(state.player.x).toBeGreaterThanOrEqual(0);
    expect(state.player.y).toBeLessThanOrEqual(640);
    expect(state.bullets).toHaveLength(0);
    expect(state.enemies).toHaveLength(0);
    expect(state.powerUps).toHaveLength(0);
    expect(state.particles).toHaveLength(0);
    expect(state.score).toBe(0);
    expect(state.lives).toBe(STARTING_LIVES);
  });
});

describe('updateGameState', () => {
  it('yıldızları ve oyuncuyu ilerletir, yeni bir state referansı döner', () => {
    const state = createInitialGameState(480, 640);

    const next = updateGameState(state, noInput, 1, 480, 640, noWaves, neverRandom);

    expect(next).not.toBe(state);
    expect(next.stars).not.toBe(state.stars);
    expect(next.status).toBe('playing');
  });

  it('girdiye göre oyuncuyu hareket ettirir', () => {
    const state = createInitialGameState(480, 640);

    const next = updateGameState(
      state,
      { ...noInput, left: true },
      1,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.player.x).toBeLessThan(state.player.x);
  });

  it('ateş tuşuna basınca yeni bir mermi ekler', () => {
    const state = createInitialGameState(480, 640);

    const next = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.bullets).toHaveLength(1);
  });

  it('düşmanla çarpışan mermi, düşmanı yok edip skoru artırır', () => {
    const base = createInitialGameState(480, 640);
    const enemy = createEnemy(1, base.player.x, base.player.y - 5, 0, 10);
    const state = { ...base, enemies: [enemy] };

    const next = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.enemies).toHaveLength(0);
    expect(next.score).toBe(10);
  });

  it("'tank' düşman tek mermiyle yok olmaz, ikinci vuruşta yok olur", () => {
    // Oyuncuyla çakışmayacak kadar uzakta (30px) ama mermi bir tikte ulaşacak kadar yakında.
    const base = createInitialGameState(480, 640);
    const tank = createEnemy(1, base.player.x, base.player.y - 30, 0, 30, 'tank');
    const state = { ...base, enemies: [tank] };

    const afterFirstHit = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(afterFirstHit.enemies).toHaveLength(1);
    expect(afterFirstHit.enemies[0]?.hp).toBe(1);
    expect(afterFirstHit.score).toBe(0);

    // İkinci atış için cooldown'ın dolmasını bekle (gerçek zamanlamayı simüle etmek yerine sıfırlanır).
    const readyToFireAgain = {
      ...afterFirstHit,
      player: { ...afterFirstHit.player, cooldownRemainingSeconds: 0 },
    };
    const afterSecondHit = updateGameState(
      readyToFireAgain,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(afterSecondHit.enemies).toHaveLength(0);
    expect(afterSecondHit.score).toBe(30);
  });

  it('düşman yok edilince patlama parçacıkları üretir', () => {
    const base = createInitialGameState(480, 640);
    const enemy = createEnemy(1, base.player.x, base.player.y - 5, 0, 10);
    const state = { ...base, enemies: [enemy] };

    const next = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.particles.length).toBeGreaterThan(0);
  });

  it('düşman oyuncuya çarparsa can azalır', () => {
    const base = createInitialGameState(480, 640);
    const enemy = createEnemy(1, base.player.x, base.player.y, 0, 10);
    const state = { ...base, enemies: [enemy] };

    const next = updateGameState(state, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(next.lives).toBe(STARTING_LIVES - 1);
  });

  it('can sıfıra düşünce oyunu gameOver yapar', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, lives: 1 };
    const enemy = createEnemy(1, base.player.x, base.player.y, 0, 10);

    const next = updateGameState(
      { ...state, enemies: [enemy] },
      noInput,
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.status).toBe('gameOver');
  });

  it("status gameOver ise state'i değiştirmeden döner", () => {
    const state = { ...createInitialGameState(480, 640), status: 'gameOver' as const };

    const next = updateGameState(
      state,
      { ...noInput, right: true },
      1,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next).toBe(state);
  });

  it('ateş edince bulletFired olayı üretir', () => {
    const state = createInitialGameState(480, 640);

    const next = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.events).toContainEqual({ type: 'bulletFired' });
  });

  it('düşman yok edilince enemyDestroyed olayı üretir', () => {
    const base = createInitialGameState(480, 640);
    const enemy = createEnemy(1, base.player.x, base.player.y - 5, 0, 10);
    const state = { ...base, enemies: [enemy] };

    const next = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.events).toContainEqual({ type: 'enemyDestroyed', scoreValue: 10 });
  });

  it('oyuncu vurulunca playerHit olayı, can biterse ayrıca gameOver olayı üretir', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, lives: 1 };
    const enemy = createEnemy(1, base.player.x, base.player.y, 0, 10);

    const next = updateGameState(
      { ...state, enemies: [enemy] },
      noInput,
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(next.events).toContainEqual({ type: 'playerHit' });
    expect(next.events).toContainEqual({ type: 'gameOver' });
  });

  it('hiçbir şey olmayan bir adımda olay üretmez', () => {
    const state = createInitialGameState(480, 640);

    const next = updateGameState(state, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(next.events).toHaveLength(0);
  });

  it('gameOver sonraki adımlarda olayları tekrar üretmez', () => {
    const base = createInitialGameState(480, 640);
    const state = { ...base, lives: 1 };
    const enemy = createEnemy(1, base.player.x, base.player.y, 0, 10);

    const first = updateGameState(
      { ...state, enemies: [enemy] },
      noInput,
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );
    const second = updateGameState(first, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(second.events).toHaveLength(0);
  });

  it('dalga tanımına göre zamanı gelen düşmanları ekler', () => {
    const waves: WaveDefinition[] = [
      { spawns: [{ atSeconds: 0, x: 100, speedPxPerSec: 50, scoreValue: 10 }] },
    ];
    const state = createInitialGameState(480, 640);

    const next = updateGameState(state, noInput, 0.1, 480, 640, waves, neverRandom);

    expect(next.enemies).toHaveLength(1);
    expect(next.enemies[0]?.x).toBe(100);
  });

  it('düşman yok edilince, random düşme eşiğinin altındaysa power-up düşer', () => {
    const base = createInitialGameState(480, 640);
    const enemy = createEnemy(1, base.player.x, base.player.y - 5, 0, 10);
    const state = { ...base, enemies: [enemy] };
    const alwaysDrop = (): number => 0;

    const next = updateGameState(
      state,
      { ...noInput, fire: true },
      1 / 60,
      480,
      640,
      noWaves,
      alwaysDrop,
    );

    expect(next.powerUps).toHaveLength(1);
    expect(next.events).toContainEqual({ type: 'bulletFired' });
  });

  it("oyuncu bir power-up'a değince buff kazanır ve powerUpCollected olayı üretir", () => {
    const base = createInitialGameState(480, 640);
    const powerUp = createPowerUp(1, base.player.x, base.player.y, 'rapidFire');
    const state = { ...base, powerUps: [powerUp] };

    const next = updateGameState(state, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(next.powerUps).toHaveLength(0);
    expect(next.player.activeBuff?.kind).toBe('rapidFire');
    expect(next.events).toContainEqual({ type: 'powerUpCollected' });
  });

  it("ateş eden düşman türü ('tank') bekleme süresi dolunca düşman mermisi üretir", () => {
    const base = createInitialGameState(480, 640);
    const tank = createEnemy(1, 100, 100, 0, 30, 'tank');
    const state = { ...base, enemies: [tank] };

    const next = updateGameState(
      state,
      noInput,
      ENEMY_FIRE_COOLDOWN_MIN_SECONDS,
      480,
      640,
      noWaves,
      () => 0,
    );

    expect(next.enemyBullets.length).toBeGreaterThan(0);
    expect(next.events).toContainEqual({ type: 'enemyFire' });
  });

  it('düşman mermisi oyuncuya çarparsa can azalır ve playerHit olayı üretir', () => {
    const base = createInitialGameState(480, 640);
    const enemyBullet = createEnemyBullet(1, base.player.x, base.player.y);
    const state = { ...base, enemyBullets: [enemyBullet] };

    const next = updateGameState(state, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(next.lives).toBe(STARTING_LIVES - 1);
    expect(next.enemyBullets).toHaveLength(0);
    expect(next.events).toContainEqual({ type: 'playerHit' });
  });

  it('bir dalga tamamlanınca levelUp olayı üretir; oyun donmadan devam eder', () => {
    const waves: WaveDefinition[] = [
      { spawns: [{ atSeconds: 0, x: 100, speedPxPerSec: 50, scoreValue: 10 }] },
    ];
    const base = createInitialGameState(480, 640);
    const state = {
      ...base,
      spawnState: { waveIndex: 0, waveElapsedSeconds: 1.5, nextEnemyId: 5 },
    };

    const next = updateGameState(
      state,
      { ...noInput, left: true },
      0.01,
      480,
      640,
      waves,
      neverRandom,
    );

    expect(next.events).toContainEqual({ type: 'levelUp', level: 2 });
    // Seviye atlama yalnızca bir bildirimdir — hareket aynı adımda normal şekilde işlenir.
    expect(next.player.x).toBeLessThan(state.player.x);
  });

  it("aktif shield buff'ı varken çarpışma canı azaltmaz", () => {
    const base = createInitialGameState(480, 640);
    const shielded = {
      ...base,
      player: { ...base.player, activeBuff: { kind: 'shield' as const, remainingCharges: 3 } },
    };
    const enemy = createEnemy(1, shielded.player.x, shielded.player.y, 0, 10);
    const state = { ...shielded, enemies: [enemy] };

    const next = updateGameState(state, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(next.lives).toBe(STARTING_LIVES);
    expect(next.events).toContainEqual({ type: 'playerHit' });
    // Kalkan sonsuz değildir — isabet alınca mühimmatı tükenir.
    expect(next.player.activeBuff?.remainingCharges).toBe(2);
  });

  it('shield mühimmatı biten bir çarpışmada buff kalkar ve bir sonraki çarpışmada can gider', () => {
    const base = createInitialGameState(480, 640);
    const shielded = {
      ...base,
      player: { ...base.player, activeBuff: { kind: 'shield' as const, remainingCharges: 1 } },
    };
    const enemy = createEnemy(1, shielded.player.x, shielded.player.y, 0, 10);

    const afterFirstHit = updateGameState(
      { ...shielded, enemies: [enemy] },
      noInput,
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(afterFirstHit.lives).toBe(STARTING_LIVES);
    expect(afterFirstHit.player.activeBuff).toBeNull();

    const secondEnemy = createEnemy(2, afterFirstHit.player.x, afterFirstHit.player.y, 0, 10);
    const afterSecondHit = updateGameState(
      { ...afterFirstHit, enemies: [secondEnemy] },
      noInput,
      1 / 60,
      480,
      640,
      noWaves,
      neverRandom,
    );

    expect(afterSecondHit.lives).toBe(STARTING_LIVES - 1);
  });

  it("extraLife power-up'ı buff uygulamaz, doğrudan can kazandırır", () => {
    const base = createInitialGameState(480, 640);
    const powerUp = createPowerUp(1, base.player.x, base.player.y, 'extraLife');
    const state = { ...base, powerUps: [powerUp], lives: 1 };

    const next = updateGameState(state, noInput, 1 / 60, 480, 640, noWaves, neverRandom);

    expect(next.lives).toBe(2);
    expect(next.player.activeBuff).toBeNull();
  });
});
