import { describe, expect, it } from 'vitest';
import { INITIAL_SPAWN_STATE, difficultyMultiplier, spawnEnemies } from './spawn';
import type { WaveDefinition } from './spawn';

const singleWave: WaveDefinition[] = [
  {
    spawns: [
      { atSeconds: 0, x: 50, speedPxPerSec: 60, scoreValue: 10 },
      { atSeconds: 1, x: 150, speedPxPerSec: 60, scoreValue: 10 },
    ],
  },
];

describe('spawnEnemies', () => {
  it('dalga tanımı yoksa hiçbir şey üretmez', () => {
    const result = spawnEnemies([], INITIAL_SPAWN_STATE, 1, 0);

    expect(result.newEnemies).toHaveLength(0);
  });

  it('atSeconds=0 olan spawn, ilk adımda (dt>0) üretilir', () => {
    const result = spawnEnemies(singleWave, INITIAL_SPAWN_STATE, 0.1, 0);

    expect(result.newEnemies).toHaveLength(1);
    expect(result.newEnemies[0]?.x).toBe(50);
    expect(result.spawnState.nextEnemyId).toBe(2);
  });

  it('henüz zamanı gelmemiş bir spawn üretilmez', () => {
    const afterFirstSpawn = spawnEnemies(singleWave, INITIAL_SPAWN_STATE, 0.1, 0);

    const result = spawnEnemies(singleWave, afterFirstSpawn.spawnState, 0.05, 1);

    expect(result.newEnemies).toHaveLength(0);
    expect(result.spawnState.waveElapsedSeconds).toBeCloseTo(0.15, 10);
  });

  it('aynı spawn birden fazla adımda tekrar üretilmez', () => {
    const first = spawnEnemies(singleWave, INITIAL_SPAWN_STATE, 0.1, 0);
    const second = spawnEnemies(singleWave, first.spawnState, 0.1, 1);

    expect(second.newEnemies).toHaveLength(0);
  });

  it('sınırı aşan bir adımdaki spawn tam olarak bir kez üretilir, sonraki adımda tekrarlanmaz', () => {
    const afterFirstSpawn = spawnEnemies(singleWave, INITIAL_SPAWN_STATE, 0.0001, 0);
    expect(afterFirstSpawn.newEnemies).toHaveLength(1);

    // [0.0001, 1.0001) aralığı atSeconds=1 sınırını içine alır.
    const crossingBoundary = spawnEnemies(singleWave, afterFirstSpawn.spawnState, 1, 0);
    expect(crossingBoundary.newEnemies).toHaveLength(1);
    expect(crossingBoundary.newEnemies[0]?.x).toBe(150);

    const afterBoundary = spawnEnemies(singleWave, crossingBoundary.spawnState, 0.1, 0);
    expect(afterBoundary.newEnemies).toHaveLength(0);
  });

  it('dalga bitip ekranda düşman kalmayınca bir sonraki dalgaya geçer (waveIndex artar, döngüsel olarak modulo ile kullanılır)', () => {
    let spawnState = INITIAL_SPAWN_STATE;
    spawnState = spawnEnemies(singleWave, spawnState, 1.1, 0).spawnState;
    // Dalga süresi (1s) + tampon (1.5s) = 2.5s; kalan süreyi büyük bir dt ile geçelim
    const result = spawnEnemies(singleWave, spawnState, 2, 0);

    expect(result.spawnState.waveIndex).toBe(1);
    expect(result.spawnState.waveElapsedSeconds).toBe(0);

    // Tek dalgalık listede bir sonraki çağrı, modulo sayesinde yine aynı dalgayı kullanır.
    const afterWrap = spawnEnemies(singleWave, result.spawnState, 0.0001, 0);
    expect(afterWrap.newEnemies).toHaveLength(1);
    expect(afterWrap.newEnemies[0]?.x).toBe(50);
  });

  it('dalga bitse bile ekranda düşman varsa bir sonraki dalgaya geçmez', () => {
    let spawnState = INITIAL_SPAWN_STATE;
    spawnState = spawnEnemies(singleWave, spawnState, 1.1, 0).spawnState;
    const result = spawnEnemies(singleWave, spawnState, 2, 3);

    expect(result.spawnState.waveIndex).toBe(0);
  });

  it('kind belirtilmemişse varsayılan olarak straight kullanır', () => {
    const result = spawnEnemies(singleWave, INITIAL_SPAWN_STATE, 0.1, 0);

    expect(result.newEnemies[0]?.kind).toBe('straight');
  });

  it('spawn tanımındaki kind alanını düşmana aktarır', () => {
    const zigzagWave: WaveDefinition[] = [
      { spawns: [{ atSeconds: 0, x: 50, speedPxPerSec: 60, scoreValue: 10, kind: 'zigzag' }] },
    ];

    const result = spawnEnemies(zigzagWave, INITIAL_SPAWN_STATE, 0.1, 0);

    expect(result.newEnemies[0]?.kind).toBe('zigzag');
  });

  it('bir tam tur sonrası düşman hızı ve skoru zorluk çarpanıyla artar', () => {
    // singleWave tek dalgalık olduğundan waveIndex=1, bir tam tur tamamlandığı anlamına gelir.
    const stateAfterOneCycle = { ...INITIAL_SPAWN_STATE, waveIndex: singleWave.length };

    const result = spawnEnemies(singleWave, stateAfterOneCycle, 0.1, 0);

    const enemy = result.newEnemies[0]!;
    expect(enemy.speedPxPerSec).toBeCloseTo(60 * 1.15, 5);
    expect(enemy.scoreValue).toBe(Math.round(10 * 1.15));
  });

  it('ilk tur (waveIndex=0) zorluk çarpanı uygulamaz', () => {
    const result = spawnEnemies(singleWave, INITIAL_SPAWN_STATE, 0.1, 0);

    expect(result.newEnemies[0]?.speedPxPerSec).toBe(60);
    expect(result.newEnemies[0]?.scoreValue).toBe(10);
  });
});

describe('difficultyMultiplier', () => {
  it('ilk turda 1 döner (zorluk artışı yok)', () => {
    expect(difficultyMultiplier(0, 3)).toBe(1);
    expect(difficultyMultiplier(2, 3)).toBe(1);
  });

  it('her tam turda %15 artar', () => {
    expect(difficultyMultiplier(3, 3)).toBeCloseTo(1.15, 10);
    expect(difficultyMultiplier(6, 3)).toBeCloseTo(1.3, 10);
  });
});
