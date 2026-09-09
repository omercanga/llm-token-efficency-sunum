import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudioManager } from './audio';

function createFakeAudioContext() {
  const oscillators: Array<{
    type: string;
    frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }> = [];

  const resume = vi.fn(() => Promise.resolve());

  const context = {
    currentTime: 0,
    destination: {},
    resume,
    createOscillator: vi.fn(() => {
      const oscillator = {
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn((dest: unknown) => dest),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(oscillator);
      return oscillator;
    }),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn((dest: unknown) => dest),
    })),
  };

  return { context, oscillators, resume };
}

describe('createAudioManager', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resume() çağrıldığında AudioContext.resume() çağrılır', () => {
    const { context, resume } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.resume();

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('play("fire") bir osilatör oluşturup başlatır ve durdurur (yumuşak triangle dalga)', () => {
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.play('fire');

    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillators[0]?.type).toBe('triangle');
    expect(oscillators[0]?.frequency.setValueAtTime).toHaveBeenCalledWith(740, 0);
    expect(oscillators[0]?.start).toHaveBeenCalledTimes(1);
    expect(oscillators[0]?.stop).toHaveBeenCalledTimes(1);
  });

  it('her sfx adı için farklı bir osilatör tipi/frekansı kullanır', () => {
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.play('explosion');
    audio.play('playerHit');
    audio.play('powerUp');
    audio.play('levelUp');
    audio.play('enemyFire');
    audio.play('gameOver');

    expect(oscillators.map((o) => o.type)).toEqual([
      'sawtooth',
      'triangle',
      'sine',
      'sine',
      'triangle',
      'triangle',
    ]);
  });

  it('startMusic() belirli aralıklarla nota çalar; stopMusic() durdurur', () => {
    vi.useFakeTimers();
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.startMusic();
    expect(context.createOscillator).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(oscillators).toHaveLength(1);
    expect(oscillators[0]?.type).toBe('square');

    vi.advanceTimersByTime(200);
    expect(oscillators).toHaveLength(2);

    audio.stopMusic();
    vi.advanceTimersByTime(2000);
    expect(oscillators).toHaveLength(2);
  });

  it('startMusic() zaten çalıyorken tekrar çağrılması ikinci bir döngü başlatmaz', () => {
    vi.useFakeTimers();
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.startMusic();
    audio.startMusic();

    vi.advanceTimersByTime(200);

    // İki zamanlayıcı başlamış olsaydı bu anda 2 nota (2 osilatör) çalınırdı.
    expect(oscillators).toHaveLength(1);
  });

  it('stopMusic() hiç başlamamış bir müziği durdurmaya çalışırsa hata vermez', () => {
    const { context } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    expect(() => audio.stopMusic()).not.toThrow();
  });

  it('setMusicIntensity(), müzik çalarken tempoyu hızlandırır (nota aralığı kısalır)', () => {
    vi.useFakeTimers();
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.startMusic();
    audio.setMusicIntensity(10);

    // Yeni (kısalmış) aralıkta bir nota çalınmalı; eski 200ms aralığında henüz çalınmamış olmalı.
    vi.advanceTimersByTime(100);
    expect(oscillators).toHaveLength(1);
  });

  it('setMusicIntensity(), müzik henüz başlamamışken çağrılırsa hata vermez ve sonraki startMusic() yeni tempoyu kullanır', () => {
    vi.useFakeTimers();
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    expect(() => audio.setMusicIntensity(20)).not.toThrow();

    audio.startMusic();
    vi.advanceTimersByTime(100);
    expect(oscillators).toHaveLength(1);
  });

  it('seviye ne kadar yüksek olursa olsun tempo bir alt sınırın altına inmez', () => {
    vi.useFakeTimers();
    const { context, oscillators } = createFakeAudioContext();
    const audio = createAudioManager(context as unknown as AudioContext);

    audio.setMusicIntensity(1000);
    audio.startMusic();

    vi.advanceTimersByTime(99);
    expect(oscillators).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(oscillators).toHaveLength(1);
  });
});
