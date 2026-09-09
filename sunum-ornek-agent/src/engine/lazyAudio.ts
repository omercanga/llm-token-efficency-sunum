import type { AudioManager } from './audio';

/**
 * Ses, yalnızca ilk kullanıcı etkileşiminden sonra (tarayıcı autoplay politikası)
 * oluşturulur. `keydown` ve `pointerdown` ayrı ayrı "once" dinleyicileri olduğundan
 * — biri tetiklenip kendini kaldırsa bile diğeri hâlâ takılı kalır — `started`
 * bayrağı olmadan ikinci bir etkileşim (ör. "Tekrar Oyna" tıklaması) ikinci bir
 * AudioContext/müzik döngüsü başlatabilir.
 */
export function attachLazyAudio(
  target: EventTarget,
  createAudio: () => AudioManager,
  onReady: (audio: AudioManager) => void,
): void {
  let started = false;
  const start = (): void => {
    if (started) {
      return;
    }
    started = true;
    target.removeEventListener('keydown', start);
    target.removeEventListener('pointerdown', start);
    onReady(createAudio());
  };
  target.addEventListener('keydown', start, { once: true });
  target.addEventListener('pointerdown', start, { once: true });
}
