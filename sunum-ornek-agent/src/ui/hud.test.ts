import { describe, expect, it } from 'vitest';
import { createHud } from './hud';

describe('createHud', () => {
  it('skoru, canı ve dalgayı metin olarak gösterir', () => {
    const root = document.createElement('div');
    const hud = createHud(root);

    hud.update(120, 2, 3);

    const element = root.querySelector('#hud');
    expect(element?.textContent).toContain('120');
    expect(element?.textContent).toContain('2');
    expect(element?.textContent).toContain('3');
  });

  it('yalnızca textContent kullanır, alt element oluşturmaz (innerHTML yasağı)', () => {
    const root = document.createElement('div');
    const hud = createHud(root);

    hud.update(0, 3, 1);

    const element = root.querySelector('#hud') as HTMLElement;
    expect(element.children).toHaveLength(0);
  });

  it('update tekrar çağrıldığında değerleri günceller', () => {
    const root = document.createElement('div');
    const hud = createHud(root);

    hud.update(10, 3, 1);
    hud.update(20, 2, 2);

    const element = root.querySelector('#hud');
    expect(element?.textContent).toContain('20');
    expect(element?.textContent).not.toContain('10');
  });
});
