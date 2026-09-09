export type SfxName =
  'fire' | 'enemyFire' | 'explosion' | 'playerHit' | 'powerUp' | 'levelUp' | 'gameOver';

export interface AudioManager {
  /** Tarayıcı autoplay politikası gereği yalnızca bir kullanıcı etkileşimi sonrasında çağrılmalıdır. */
  resume(): void;
  play(sfx: SfxName): void;
  /** Sessiz, döngülü bir arka plan melodisi başlatır (zaten çalıyorsa hiçbir şey yapmaz). */
  startMusic(): void;
  stopMusic(): void;
  /** Seviye arttıkça müzik temposu hızlanır — oyuncunun ilerlemesini müzikte de hissettirir. */
  setMusicIntensity(level: number): void;
}

interface BeepSpec {
  readonly frequency: number;
  readonly durationSeconds: number;
  readonly type: OscillatorType;
  /** Belirtilmezse DEFAULT_GAIN kullanılır. Sık tekrarlanan sesler (ateş) daha düşük tutulur. */
  readonly gain?: number;
}

const DEFAULT_GAIN = 0.2;
const MIN_GAIN = 0.0001;

const SFX: Record<SfxName, BeepSpec> = {
  // Sık tekrarlanan ateş sesleri yumuşak (triangle/sine) ve kısık tutulur — sert 'square' dalga rahatsız edici.
  fire: { frequency: 740, durationSeconds: 0.07, type: 'triangle', gain: 0.1 },
  enemyFire: { frequency: 260, durationSeconds: 0.09, type: 'triangle', gain: 0.1 },
  explosion: { frequency: 120, durationSeconds: 0.25, type: 'sawtooth' },
  playerHit: { frequency: 200, durationSeconds: 0.35, type: 'triangle' },
  powerUp: { frequency: 660, durationSeconds: 0.18, type: 'sine' },
  levelUp: { frequency: 1046, durationSeconds: 0.35, type: 'sine' },
  gameOver: { frequency: 60, durationSeconds: 0.6, type: 'triangle' },
};

/**
 * Arka plan müziği: döngülenen, ritmik bir retro arcade bas riffi (La minör).
 * Kısık (SFX'lerin altında) ama net bir "square" tonla çalınır — sürükleyici
 * ama dikkat dağıtmayan bir arka plan hissi hedefler.
 */
const MUSIC_PATTERN_HZ = [110, 110, 130.81, 110, 98, 98, 110, 82.41] as const;
const MUSIC_NOTE_INTERVAL_SECONDS = 0.2;
/** Notanın gerçekten duyulan kısmı — aralığın tamamı değil, staccato/ritmik bir "nefes" bırakır. */
const MUSIC_NOTE_AUDIBLE_RATIO = 0.65;
const MUSIC_NOTE_GAIN = 0.07;
const MUSIC_WAVE_TYPE: OscillatorType = 'square';
/** Her seviyede tempo bu kadar kısalır (saniye); belirli bir sınırın altına inmez. */
const MUSIC_TEMPO_STEP_SECONDS_PER_LEVEL = 0.012;
const MUSIC_MIN_NOTE_INTERVAL_SECONDS = 0.1;

function noteIntervalForLevel(level: number): number {
  const steppedDown =
    MUSIC_NOTE_INTERVAL_SECONDS - (level - 1) * MUSIC_TEMPO_STEP_SECONDS_PER_LEVEL;
  return Math.max(MUSIC_MIN_NOTE_INTERVAL_SECONDS, steppedDown);
}

/**
 * Web Audio API ile prosedürel retro bip sesleri ve arka plan melodisi üretir;
 * harici ses dosyası kullanılmaz (bkz. docs/adr/0001-render-technique.md, FAZ 0
 * kapsam kararı).
 */
export function createAudioManager(context: AudioContext): AudioManager {
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let musicNoteIndex = 0;
  let noteIntervalSeconds = MUSIC_NOTE_INTERVAL_SECONDS;

  function beep(spec: BeepSpec): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = spec.type;
    oscillator.frequency.setValueAtTime(spec.frequency, context.currentTime);

    gain.gain.setValueAtTime(spec.gain ?? DEFAULT_GAIN, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, context.currentTime + spec.durationSeconds);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + spec.durationSeconds);
  }

  function playMusicNote(frequency: number): void {
    const audibleSeconds = noteIntervalSeconds * MUSIC_NOTE_AUDIBLE_RATIO;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = MUSIC_WAVE_TYPE;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);

    gain.gain.setValueAtTime(MUSIC_NOTE_GAIN, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, context.currentTime + audibleSeconds);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + audibleSeconds);
  }

  function scheduleMusicTimer(): void {
    musicTimer = setInterval(() => {
      playMusicNote(MUSIC_PATTERN_HZ[musicNoteIndex % MUSIC_PATTERN_HZ.length]!);
      musicNoteIndex += 1;
    }, noteIntervalSeconds * 1000);
  }

  return {
    resume(): void {
      void context.resume();
    },
    play(sfx: SfxName): void {
      beep(SFX[sfx]);
    },
    startMusic(): void {
      if (musicTimer !== null) {
        return;
      }
      scheduleMusicTimer();
    },
    stopMusic(): void {
      if (musicTimer !== null) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
    setMusicIntensity(level: number): void {
      noteIntervalSeconds = noteIntervalForLevel(level);
      if (musicTimer !== null) {
        clearInterval(musicTimer);
        scheduleMusicTimer();
      }
    },
  };
}
