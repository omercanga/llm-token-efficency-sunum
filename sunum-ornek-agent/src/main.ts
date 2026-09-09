import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FIXED_TIMESTEP_SECONDS,
  HIGH_SCORE_LIST_SIZE,
  LEVEL_FLASH_DURATION_MS,
  LEVEL_TRANSITION_SECONDS,
  MAX_FRAME_DELTA_SECONDS,
  SCREEN_SHAKE_BIG_KILL_DURATION_MS,
  SCREEN_SHAKE_BIG_KILL_MAGNITUDE_PX,
  SCREEN_SHAKE_BIG_KILL_SCORE_THRESHOLD,
  SCREEN_SHAKE_HIT_DURATION_MS,
  SCREEN_SHAKE_HIT_MAGNITUDE_PX,
  SCREEN_SHAKE_LEVEL_UP_DURATION_MS,
  SCREEN_SHAKE_LEVEL_UP_MAGNITUDE_PX,
} from './config/constants';
import { type GameLoopHandle, startGameLoop } from './engine/loop';
import { drawLevelFlash, render } from './engine/render';
import { InputManager } from './engine/input';
import { type AudioManager, type SfxName, createAudioManager } from './engine/audio';
import { attachLazyAudio } from './engine/lazyAudio';
import {
  type ScreenShakeState,
  screenShakeOffset,
  tickScreenShake,
  triggerScreenShake,
} from './engine/screenShake';
import {
  type LevelFlashState,
  hueForLevel,
  tickLevelFlash,
  triggerLevelFlash,
} from './engine/levelFlash';
import { type GameState, createInitialGameState, updateGameState } from './state/gameState';
import { createHud } from './ui/hud';
import { createGameOverScreen } from './ui/gameOverScreen';
import { createLevelBanner } from './ui/levelBanner';
import { createLocalStorageHighScoreAdapter } from './persistence/localStorageHighScoreAdapter';
import { describeNameValidationFailure, validatePlayerName } from './persistence/nameValidation';

/** Uygulama giriş noktası: canvas'ı ve DOM tabanlı UI'ı bağlar, game loop'u başlatır. Oyun mantığı burada değil, state/systems altında yaşar. */
function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('#app kök elemanı bulunamadı');
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  root.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D render context alınamadı');
  }

  const hud = createHud(root);
  const levelBanner = createLevelBanner(root);
  const highScoreStorage = createLocalStorageHighScoreAdapter(window.localStorage);

  let audio: AudioManager | null = null;
  attachLazyAudio(
    window,
    () => {
      const readyAudio = createAudioManager(new AudioContext());
      readyAudio.resume();
      return readyAudio;
    },
    (readyAudio) => {
      audio = readyAudio;
      readyAudio.startMusic();
    },
  );
  const playSfx = (sfx: SfxName): void => audio?.play(sfx);

  let finalScore = 0;
  let gameOverShown = false;
  let levelBannerHideTimer: ReturnType<typeof setTimeout> | null = null;
  let shakeState: ScreenShakeState | null = null;
  let levelFlashState: LevelFlashState | null = null;
  let lastShakeTickMs = performance.now();

  const gameOverScreen = createGameOverScreen(root, {
    onSubmitName: (rawName) => {
      const validation = validatePlayerName(rawName);
      if (!validation.valid) {
        gameOverScreen.showError(describeNameValidationFailure(validation.reason));
        return;
      }

      void highScoreStorage
        .submitScore({
          name: validation.name,
          score: finalScore,
          achievedAt: new Date().toISOString(),
        })
        .then(() => highScoreStorage.getTopScores(HIGH_SCORE_LIST_SIZE))
        .then((entries) => gameOverScreen.showHighScores(entries));
    },
    onRestart: () => {
      gameOverScreen.hide();
      gameOverShown = false;
      finalScore = 0;
      loopHandle.reset(createInitialGameState(CANVAS_WIDTH, CANVAS_HEIGHT));
      audio?.setMusicIntensity(1);
      audio?.startMusic();
    },
  });

  const input = new InputManager();
  input.attach(window);

  const loopHandle: GameLoopHandle<GameState> = startGameLoop({
    initialState: createInitialGameState(CANVAS_WIDTH, CANVAS_HEIGHT),
    timestepSeconds: FIXED_TIMESTEP_SECONDS,
    maxDeltaSeconds: MAX_FRAME_DELTA_SECONDS,
    step: (state) =>
      updateGameState(state, input.snapshot(), FIXED_TIMESTEP_SECONDS, CANVAS_WIDTH, CANVAS_HEIGHT),
    render: (state) => {
      const now = performance.now();
      const deltaMs = now - lastShakeTickMs;
      shakeState = tickScreenShake(shakeState, deltaMs);
      levelFlashState = tickLevelFlash(levelFlashState, deltaMs);
      lastShakeTickMs = now;

      render(ctx, state, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawLevelFlash(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, levelFlashState);
      hud.update(state.score, state.lives, state.spawnState.waveIndex + 1);

      for (const event of state.events) {
        switch (event.type) {
          case 'bulletFired':
            playSfx('fire');
            break;
          case 'enemyFire':
            playSfx('enemyFire');
            break;
          case 'enemyDestroyed':
            playSfx('explosion');
            if (event.scoreValue >= SCREEN_SHAKE_BIG_KILL_SCORE_THRESHOLD) {
              shakeState = triggerScreenShake(
                SCREEN_SHAKE_BIG_KILL_MAGNITUDE_PX,
                SCREEN_SHAKE_BIG_KILL_DURATION_MS,
              );
            }
            break;
          case 'playerHit':
            playSfx('playerHit');
            shakeState = triggerScreenShake(
              SCREEN_SHAKE_HIT_MAGNITUDE_PX,
              SCREEN_SHAKE_HIT_DURATION_MS,
            );
            break;
          case 'powerUpCollected':
            playSfx('powerUp');
            break;
          case 'levelUp':
            playSfx('levelUp');
            audio?.setMusicIntensity(event.level);
            // Oyun akmaya devam eder; banner yalnızca üstte kısa süreliğine görünen bir bildirimdir.
            levelBanner.show(event.level);
            if (levelBannerHideTimer !== null) {
              clearTimeout(levelBannerHideTimer);
            }
            levelBannerHideTimer = setTimeout(() => {
              levelBanner.hide();
              levelBannerHideTimer = null;
            }, LEVEL_TRANSITION_SECONDS * 1000);
            shakeState = triggerScreenShake(
              SCREEN_SHAKE_LEVEL_UP_MAGNITUDE_PX,
              SCREEN_SHAKE_LEVEL_UP_DURATION_MS,
            );
            levelFlashState = triggerLevelFlash(hueForLevel(event.level), LEVEL_FLASH_DURATION_MS);
            break;
          case 'gameOver':
            playSfx('gameOver');
            audio?.stopMusic();
            break;
        }
      }

      const shakeOffset = screenShakeOffset(shakeState);
      canvas.style.transform =
        shakeOffset.x !== 0 || shakeOffset.y !== 0
          ? `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`
          : '';

      if (state.status === 'gameOver' && !gameOverShown) {
        gameOverShown = true;
        finalScore = state.score;
        gameOverScreen.show(finalScore);
      }
    },
  });
}

bootstrap();
