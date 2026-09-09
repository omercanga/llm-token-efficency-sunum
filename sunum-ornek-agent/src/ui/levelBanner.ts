const VISIBLE_CLASS = 'visible';

/** Seviye geçiş banner'ı ("SEVİYE N"). DOM'a dokunan katman; yalnızca `textContent` kullanılır (XSS politikası, docs/SECURITY.md). */
export interface LevelBanner {
  show(level: number): void;
  hide(): void;
}

export function createLevelBanner(root: HTMLElement): LevelBanner {
  const element = document.createElement('div');
  element.id = 'level-banner';
  root.appendChild(element);

  return {
    show(level: number): void {
      element.textContent = `SEVİYE ${level}`;
      element.classList.add(VISIBLE_CLASS);
    },
    hide(): void {
      element.classList.remove(VISIBLE_CLASS);
    },
  };
}
