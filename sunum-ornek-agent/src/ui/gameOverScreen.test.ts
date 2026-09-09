import { describe, expect, it, vi } from 'vitest';
import { createGameOverScreen } from './gameOverScreen';

function setup() {
  const root = document.createElement('div');
  const onSubmitName = vi.fn();
  const onRestart = vi.fn();
  const screen = createGameOverScreen(root, { onSubmitName, onRestart });
  return { root, onSubmitName, onRestart, screen };
}

describe('createGameOverScreen', () => {
  it('başlangıçta gizlidir', () => {
    const { root } = setup();

    const element = root.querySelector('#game-over') as HTMLElement;
    expect(element.hidden).toBe(true);
  });

  it('show() çağrılınca görünür olur, skoru gösterir ve formu sıfırlar', () => {
    const { root, screen } = setup();
    const input = root.querySelector('#player-name-input') as HTMLInputElement;
    input.value = 'eski değer';

    screen.show(250);

    const element = root.querySelector('#game-over') as HTMLElement;
    expect(element.hidden).toBe(false);
    expect(element.textContent).toContain('250');
    expect(input.value).toBe('');
  });

  it('hide() çağrılınca tekrar gizlenir', () => {
    const { root, screen } = setup();
    screen.show(10);

    screen.hide();

    const element = root.querySelector('#game-over') as HTMLElement;
    expect(element.hidden).toBe(true);
  });

  it('form gönderilince onSubmitName girilen isimle çağrılır', () => {
    const { root, screen, onSubmitName } = setup();
    screen.show(10);
    const input = root.querySelector('#player-name-input') as HTMLInputElement;
    const form = root.querySelector('.game-over__form') as HTMLFormElement;
    input.value = 'Ada';

    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    expect(onSubmitName).toHaveBeenCalledWith('Ada');
  });

  it('showError() hata mesajını metin olarak gösterir', () => {
    const { root, screen } = setup();
    screen.show(10);

    screen.showError('İsim boş olamaz.');

    const errorLine = root.querySelector('.game-over__error') as HTMLElement;
    expect(errorLine.hidden).toBe(false);
    expect(errorLine.textContent).toBe('İsim boş olamaz.');
  });

  it('showHighScores() formu gizler ve skor listesini textContent ile gösterir', () => {
    const { root, screen } = setup();
    screen.show(10);

    screen.showHighScores([
      { name: 'Ada', score: 300 },
      { name: 'Grace', score: 200 },
    ]);

    const form = root.querySelector('.game-over__form') as HTMLElement;
    const list = root.querySelector('.game-over__scores') as HTMLElement;
    expect(form.hidden).toBe(true);
    expect(list.hidden).toBe(false);
    expect(list.children).toHaveLength(2);
    expect(list.children[0]?.textContent).toContain('Ada');
    expect(list.children[0]?.textContent).toContain('300');
  });

  it('skor listesindeki bir ismi HTML olarak yorumlamaz (XSS savunması)', () => {
    const { root, screen } = setup();
    screen.show(10);

    screen.showHighScores([{ name: '<img src=x onerror=alert(1)>', score: 5 }]);

    const list = root.querySelector('.game-over__scores') as HTMLElement;
    expect(list.querySelector('img')).toBeNull();
    expect(list.textContent).toContain('<img');
  });

  it('"Tekrar Oyna" düğmesine tıklanınca onRestart çağrılır', () => {
    const { root, onRestart } = setup();

    const restartButton = root.querySelector('.game-over__restart') as HTMLButtonElement;
    restartButton.click();

    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('"Tekrar Oyna" düğmesi skor listesi gösterilirken de erişilebilir kalır', () => {
    const { root, screen } = setup();
    screen.show(10);
    screen.showHighScores([{ name: 'Ada', score: 10 }]);

    const restartButton = root.querySelector('.game-over__restart') as HTMLButtonElement;
    expect(restartButton.hidden).toBe(false);
  });
});
