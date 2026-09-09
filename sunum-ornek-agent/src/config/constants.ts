/** Oyun genelinde kullanılan sabitler. Magic number kullanımı yasaktır — her sayısal değer buraya eklenir. */

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

/** Sabit zaman adımı (saniye). 60 Hz simülasyon. */
export const FIXED_TIMESTEP_SECONDS = 1 / 60;

/** Bir frame'de simülasyonun "spiral of death"a girmemesi için üst sınır. */
export const MAX_FRAME_DELTA_SECONDS = 0.25;

export const PLAYER_WIDTH = 28;
export const PLAYER_HEIGHT = 28;
/** Oyuncu gemisinin saniyedeki piksel hızı. */
export const PLAYER_SPEED_PX_PER_SEC = 220;
/** Oyuncunun ekran kenarına ne kadar yaklaşabileceği (kenar boşluğu). */
export const PLAY_AREA_MARGIN = 8;

export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 12;
export const BULLET_SPEED_PX_PER_SEC = 480;
/** İki ateş arasındaki minimum süre (saniye) — mermi spam'ini önler. */
export const FIRE_COOLDOWN_SECONDS = 0.25;

export const ENEMY_WIDTH = 24;
export const ENEMY_HEIGHT = 24;
export const DEFAULT_ENEMY_SCORE_VALUE = 10;
/** 'tank' türü düşmanın can puanı (kaç vuruşta yok olur). */
export const TANK_ENEMY_HP = 2;
/** Zigzag hareketin genliği (px) ve açısal frekansı (radyan/sn). */
export const ZIGZAG_AMPLITUDE_PX = 50;
export const ZIGZAG_FREQUENCY_RAD_PER_SEC = 2;

/** 'diver' düşmanı, ekranın bu oranından (yükseklik) sonra oyuncuya doğru dalışa geçer. */
export const DIVER_DIVE_TRIGGER_Y_RATIO = 0.35;
/** 'diver'ın dalış sırasındaki yatay yönelme hızı (px/sn). */
export const DIVER_HOMING_SPEED_PX_PER_SEC = 150;

/** 'boss' türü düşman diğerlerinden büyük, dayanıklı ve daha çok puan eder. */
export const BOSS_WIDTH = 44;
export const BOSS_HEIGHT = 44;
export const BOSS_ENEMY_HP = 5;

export const ENEMY_BULLET_WIDTH = 4;
export const ENEMY_BULLET_HEIGHT = 10;
export const ENEMY_BULLET_SPEED_PX_PER_SEC = 220;
/** Ateş eden düşman türü bir sonraki atışa kadar bu aralıkta rastgele bekler (saniye). */
export const ENEMY_FIRE_COOLDOWN_MIN_SECONDS = 1.2;
export const ENEMY_FIRE_COOLDOWN_RANGE_SECONDS = 1.8;

export const STARTING_LIVES = 3;

/** Her dalga döngüsünde (3 dalga bir tur) zorluğun ne kadar arttığı. */
export const DIFFICULTY_STEP_PER_CYCLE = 0.15;

/** "SEVİYE N" banner'ının ekranda görünür kalma süresi (saniye) — oyun akmaya devam eder, yalnızca bildirimdir. */
export const LEVEL_TRANSITION_SECONDS = 1.6;

/** Patlama efekti başına üretilen parçacık sayısı ve ömür aralığı (saniye). */
export const EXPLOSION_PARTICLE_COUNT = 10;
export const PARTICLE_MIN_LIFE_SECONDS = 0.3;
export const PARTICLE_LIFE_RANGE_SECONDS = 0.3;
export const PARTICLE_MIN_SPEED_PX_PER_SEC = 60;
export const PARTICLE_SPEED_RANGE_PX_PER_SEC = 120;

export const POWER_UP_WIDTH = 18;
export const POWER_UP_HEIGHT = 18;
export const POWER_UP_FALL_SPEED_PX_PER_SEC = 90;
/** Bir düşman yok edilince power-up düşme ihtimali (0-1). */
export const POWER_UP_DROP_CHANCE = 0.15;
export const RAPID_FIRE_COOLDOWN_SECONDS = 0.08;
export const MULTI_SHOT_BULLET_OFFSET_PX = 14;

/**
 * Silah buff'ları süreyle değil, "mühimmat" ile tükenir — her ateşte 1 azalır
 * (shield ise her isabette 1 azalır). Kalan miktar geminin üzerinde bir
 * çubukla gösterilir (bkz. engine/render.ts).
 */
export const RAPID_FIRE_CHARGES = 20;
export const MULTI_SHOT_CHARGES = 15;
export const PIERCE_CHARGES = 12;
export const SHIELD_CHARGES = 3;

/** Ekran sarsıntısı: oyuncu isabet alınca küçük, güçlü bir düşman (ör. boss) yok olunca büyük. */
export const SCREEN_SHAKE_HIT_MAGNITUDE_PX = 4;
export const SCREEN_SHAKE_HIT_DURATION_MS = 180;
export const SCREEN_SHAKE_BIG_KILL_MAGNITUDE_PX = 7;
export const SCREEN_SHAKE_BIG_KILL_DURATION_MS = 260;
/** Bu ve üzerindeki skor değerine sahip bir düşman yok edilince "büyük öldürme" sarsıntısı tetiklenir. */
export const SCREEN_SHAKE_BIG_KILL_SCORE_THRESHOLD = 50;
/** Seviye atlama anındaki sarsıntı — oyun durmadan geçişi "hissettiren" bir vurgu. */
export const SCREEN_SHAKE_LEVEL_UP_MAGNITUDE_PX = 6;
export const SCREEN_SHAKE_LEVEL_UP_DURATION_MS = 220;
/** Seviye atlayınca tüm sahneyi kısa süreliğine kaplayan renkli flaşın süresi (ms). */
export const LEVEL_FLASH_DURATION_MS = 400;

/** docs/SECURITY.md — oyuncu ismi için uzunluk kısıtı. */
export const MAX_PLAYER_NAME_LENGTH = 12;
export const HIGH_SCORE_LIST_SIZE = 10;
/** localStorage'da tutulan toplam kayıt sayısının üst sınırı (sınırsız büyümeyi önler). */
export const MAX_STORED_HIGH_SCORES = 100;
