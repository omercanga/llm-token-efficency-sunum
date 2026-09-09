import { describe, expect, it } from 'vitest';
import { DEFAULT_KEY_BINDINGS, InputManager, computeInputSnapshot } from './input';

describe('computeInputSnapshot', () => {
  it('yalnızca eşlemedeki tuşlar basılıyken ilgili yönü true yapar', () => {
    const pressed = new Set(['ArrowUp', 'Space']);

    const snapshot = computeInputSnapshot(pressed, DEFAULT_KEY_BINDINGS);

    expect(snapshot).toEqual({ up: true, down: false, left: false, right: false, fire: true });
  });

  it('özel bir eşlemeyle (WASD) çalışır', () => {
    const bindings = {
      moveUp: 'KeyW',
      moveDown: 'KeyS',
      moveLeft: 'KeyA',
      moveRight: 'KeyD',
      fire: 'KeyJ',
    };
    const pressed = new Set(['KeyA', 'KeyJ']);

    const snapshot = computeInputSnapshot(pressed, bindings);

    expect(snapshot).toEqual({ up: false, down: false, left: true, right: false, fire: true });
  });
});

describe('InputManager', () => {
  it("keydown ile basılan tuşu snapshot'a yansıtır, keyup ile kaldırır", () => {
    const target = new EventTarget();
    const manager = new InputManager();
    manager.attach(target);

    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    expect(manager.snapshot().right).toBe(true);

    target.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }));
    expect(manager.snapshot().right).toBe(false);
  });

  it('setBindings ile tuş eşlemesi çalışma zamanında değiştirilebilir', () => {
    const target = new EventTarget();
    const manager = new InputManager();
    manager.attach(target);
    manager.setBindings({ ...DEFAULT_KEY_BINDINGS, fire: 'KeyF' });

    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF' }));
    expect(manager.snapshot().fire).toBe(true);

    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    // Space artık ateş etme tuşuna bağlı değil.
    expect(manager.snapshot().fire).toBe(true); // KeyF hâlâ basılı olduğundan true kalır
  });

  it("attach'in döndürdüğü temizlik fonksiyonu dinleyicileri kaldırır", () => {
    const target = new EventTarget();
    const manager = new InputManager();
    const detach = manager.attach(target);

    detach();
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));

    expect(manager.snapshot().up).toBe(false);
  });
});
