import { describe, expect, it, vi } from 'vitest';
import { attachLazyAudio } from './lazyAudio';
import type { AudioManager } from './audio';

function fakeAudio(): AudioManager {
  return {
    resume: vi.fn(),
    play: vi.fn(),
    startMusic: vi.fn(),
    stopMusic: vi.fn(),
    setMusicIntensity: vi.fn(),
  };
}

describe('attachLazyAudio', () => {
  it('keydown tetiklenince ses oluşturur ve hazır olduğunda bildirir', () => {
    const target = new EventTarget();
    const createAudio = vi.fn(fakeAudio);
    const onReady = vi.fn();

    attachLazyAudio(target, createAudio, onReady);
    target.dispatchEvent(new Event('keydown'));

    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('pointerdown tetiklenince ses oluşturur ve hazır olduğunda bildirir', () => {
    const target = new EventTarget();
    const createAudio = vi.fn(fakeAudio);
    const onReady = vi.fn();

    attachLazyAudio(target, createAudio, onReady);
    target.dispatchEvent(new Event('pointerdown'));

    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('keydown ateşlendikten sonra pointerdown ikinci bir ses oluşturmaz (çift müzik hatası)', () => {
    const target = new EventTarget();
    const createAudio = vi.fn(fakeAudio);
    const onReady = vi.fn();

    attachLazyAudio(target, createAudio, onReady);
    target.dispatchEvent(new Event('keydown'));
    target.dispatchEvent(new Event('pointerdown'));

    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('pointerdown ateşlendikten sonra keydown ikinci bir ses oluşturmaz (çift müzik hatası)', () => {
    const target = new EventTarget();
    const createAudio = vi.fn(fakeAudio);
    const onReady = vi.fn();

    attachLazyAudio(target, createAudio, onReady);
    target.dispatchEvent(new Event('pointerdown'));
    target.dispatchEvent(new Event('keydown'));

    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('aynı etkileşim türü tekrar tetiklense bile ikinci kez ses oluşturmaz', () => {
    const target = new EventTarget();
    const createAudio = vi.fn(fakeAudio);
    const onReady = vi.fn();

    attachLazyAudio(target, createAudio, onReady);
    target.dispatchEvent(new Event('keydown'));
    target.dispatchEvent(new Event('keydown'));
    target.dispatchEvent(new Event('pointerdown'));

    expect(createAudio).toHaveBeenCalledTimes(1);
  });
});
