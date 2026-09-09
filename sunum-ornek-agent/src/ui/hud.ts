/** Skor/can/seviye göstergesi. DOM'a dokunan katman burasıdır; yalnızca `textContent` kullanılır (XSS politikası, docs/SECURITY.md). */
export interface Hud {
  update(score: number, lives: number, level: number): void;
}

export function createHud(root: HTMLElement): Hud {
  const element = document.createElement('div');
  element.id = 'hud';
  element.setAttribute('aria-live', 'polite');
  root.appendChild(element);

  return {
    update(score: number, lives: number, level: number): void {
      element.textContent = `SKOR: ${score}   CAN: ${lives}   SEVİYE: ${level}`;
    },
  };
}
