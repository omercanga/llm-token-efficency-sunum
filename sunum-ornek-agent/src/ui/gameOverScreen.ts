import { MAX_PLAYER_NAME_LENGTH } from '../config/constants';

export interface GameOverScreenCallbacks {
  onSubmitName(rawName: string): void;
  onRestart(): void;
}

export interface HighScoreListItem {
  readonly name: string;
  readonly score: number;
}

/** Oyun sonu ekranı: skor, isim girişi, (gönderim sonrası) skor tablosu ve yeniden başlatma. DOM'a dokunan katman; yalnızca `textContent` kullanılır (XSS politikası, docs/SECURITY.md). */
export interface GameOverScreen {
  show(score: number): void;
  hide(): void;
  showError(message: string): void;
  showHighScores(entries: readonly HighScoreListItem[]): void;
}

export function createGameOverScreen(
  root: HTMLElement,
  callbacks: GameOverScreenCallbacks,
): GameOverScreen {
  const element = document.createElement('div');
  element.id = 'game-over';
  element.hidden = true;

  const title = document.createElement('p');
  title.className = 'game-over__title';
  title.textContent = 'OYUN BİTTİ';

  const scoreLine = document.createElement('p');
  scoreLine.className = 'game-over__score';

  const form = document.createElement('form');
  form.className = 'game-over__form';
  form.noValidate = true;

  const label = document.createElement('label');
  label.htmlFor = 'player-name-input';
  label.textContent = 'İsminiz:';

  const input = document.createElement('input');
  input.id = 'player-name-input';
  input.type = 'text';
  input.maxLength = MAX_PLAYER_NAME_LENGTH;
  input.autocomplete = 'off';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Kaydet';

  form.append(label, input, submitButton);

  const errorLine = document.createElement('p');
  errorLine.className = 'game-over__error';
  errorLine.hidden = true;

  const scoresList = document.createElement('ol');
  scoresList.className = 'game-over__scores';
  scoresList.hidden = true;

  const restartButton = document.createElement('button');
  restartButton.type = 'button';
  restartButton.className = 'game-over__restart';
  restartButton.textContent = 'Tekrar Oyna';

  element.append(title, scoreLine, form, errorLine, scoresList, restartButton);
  root.appendChild(element);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    callbacks.onSubmitName(input.value);
  });

  restartButton.addEventListener('click', () => {
    callbacks.onRestart();
  });

  return {
    show(score: number): void {
      scoreLine.textContent = `Skor: ${score}`;
      errorLine.hidden = true;
      errorLine.textContent = '';
      scoresList.hidden = true;
      scoresList.textContent = '';
      form.hidden = false;
      input.value = '';
      element.hidden = false;
    },

    hide(): void {
      element.hidden = true;
    },

    showError(message: string): void {
      errorLine.textContent = message;
      errorLine.hidden = false;
    },

    showHighScores(entries: readonly HighScoreListItem[]): void {
      form.hidden = true;
      errorLine.hidden = true;
      scoresList.textContent = '';
      for (const entry of entries) {
        const item = document.createElement('li');
        // textContent kullanılır — kullanıcı adı doğrulanmış olsa bile ikinci savunma hattı.
        item.textContent = `${entry.name} — ${entry.score}`;
        scoresList.appendChild(item);
      }
      scoresList.hidden = false;
    },
  };
}
