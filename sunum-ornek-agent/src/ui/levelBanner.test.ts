import { describe, expect, it } from 'vitest';
import { createLevelBanner } from './levelBanner';

describe('createLevelBanner', () => {
  it('başlangıçta gizlidir (visible sınıfı yok)', () => {
    const root = document.createElement('div');
    createLevelBanner(root);

    const element = root.querySelector('#level-banner') as HTMLElement;
    expect(element.classList.contains('visible')).toBe(false);
  });

  it('show() çağrılınca visible sınıfı eklenir ve seviye numarasını metin olarak gösterir (yumuşak geçiş CSS ile sağlanır)', () => {
    const root = document.createElement('div');
    const banner = createLevelBanner(root);

    banner.show(4);

    const element = root.querySelector('#level-banner') as HTMLElement;
    expect(element.classList.contains('visible')).toBe(true);
    expect(element.textContent).toContain('4');
  });

  it('hide() çağrılınca visible sınıfı kaldırılır', () => {
    const root = document.createElement('div');
    const banner = createLevelBanner(root);
    banner.show(2);

    banner.hide();

    const element = root.querySelector('#level-banner') as HTMLElement;
    expect(element.classList.contains('visible')).toBe(false);
  });

  it('yalnızca textContent kullanır, alt element oluşturmaz', () => {
    const root = document.createElement('div');
    const banner = createLevelBanner(root);

    banner.show(1);

    const element = root.querySelector('#level-banner') as HTMLElement;
    expect(element.children).toHaveLength(0);
  });
});
