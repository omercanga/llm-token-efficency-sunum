/**
 * Tuş eşlemesi. `KeyboardEvent.code` değerleri kullanılır (klavye düzeninden
 * bağımsız, fiziksel tuş konumu). Erişilebilirlik gereksinimi (NFR-2):
 * bu eşleme `setBindings` ile çalışma zamanında değiştirilebilir; v1'de
 * bunun için bir oyun içi arayüz yoktur (bkz. FAZ 0 kapsam kararı).
 */
export interface KeyBindings {
  readonly moveUp: string;
  readonly moveDown: string;
  readonly moveLeft: string;
  readonly moveRight: string;
  readonly fire: string;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  fire: 'Space',
};

export interface InputSnapshot {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
  readonly fire: boolean;
}

/** Basılı tuş kodlarından, geçerli eşlemeye göre bir anlık girdi durumu üretir. Saf fonksiyon. */
export function computeInputSnapshot(
  pressedCodes: ReadonlySet<string>,
  bindings: KeyBindings,
): InputSnapshot {
  return {
    up: pressedCodes.has(bindings.moveUp),
    down: pressedCodes.has(bindings.moveDown),
    left: pressedCodes.has(bindings.moveLeft),
    right: pressedCodes.has(bindings.moveRight),
    fire: pressedCodes.has(bindings.fire),
  };
}

/** Klavye olaylarını dinleyip anlık girdi durumu üreten ince, durum tutan sarmalayıcı. */
export class InputManager {
  private readonly pressedCodes = new Set<string>();
  private bindings: KeyBindings;

  constructor(bindings: KeyBindings = DEFAULT_KEY_BINDINGS) {
    this.bindings = bindings;
  }

  setBindings(bindings: KeyBindings): void {
    this.bindings = bindings;
  }

  /** Olay dinleyicilerini bağlar; çağıranın saklayıp temizlik için çağıracağı bir fonksiyon döner. */
  attach(target: EventTarget): () => void {
    const onKeyDown = (event: Event): void => {
      this.pressedCodes.add((event as KeyboardEvent).code);
    };
    const onKeyUp = (event: Event): void => {
      this.pressedCodes.delete((event as KeyboardEvent).code);
    };

    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);

    return () => {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    };
  }

  snapshot(): InputSnapshot {
    return computeInputSnapshot(this.pressedCodes, this.bindings);
  }
}
