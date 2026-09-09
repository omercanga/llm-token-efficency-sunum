import { type Bullet, createBullet } from '../entities/bullet';
import type { Player, PlayerBuff } from '../entities/player';
import type { PowerUpKind } from '../entities/powerUp';
import type { InputSnapshot } from '../engine/input';
import {
  BULLET_WIDTH,
  FIRE_COOLDOWN_SECONDS,
  MULTI_SHOT_BULLET_OFFSET_PX,
  MULTI_SHOT_CHARGES,
  PIERCE_CHARGES,
  RAPID_FIRE_CHARGES,
  RAPID_FIRE_COOLDOWN_SECONDS,
  SHIELD_CHARGES,
} from '../config/constants';

export interface FireResult {
  readonly player: Player;
  readonly bullets: readonly Bullet[];
  readonly nextBulletId: number;
}

/** Bu türler her ateşte 1 mühimmat tüketir (shield hariç — o yalnızca isabet alınca tükenir). */
const WEAPON_BUFF_KINDS: ReadonlySet<PowerUpKind> = new Set(['rapidFire', 'multiShot', 'pierce']);

const INITIAL_CHARGES: Record<PowerUpKind, number> = {
  rapidFire: RAPID_FIRE_CHARGES,
  multiShot: MULTI_SHOT_CHARGES,
  pierce: PIERCE_CHARGES,
  shield: SHIELD_CHARGES,
  // extraLife anında uygulanır, hiçbir zaman bir buff nesnesi olmaz (bkz. state/gameState.ts).
  extraLife: 0,
};

/** Bir buff türünün başlangıç mühimmat miktarı — geminin üzerindeki çubuğun oranını hesaplamak için de kullanılır. */
export function maxChargesForBuffKind(kind: PowerUpKind): number {
  return INITIAL_CHARGES[kind];
}

/** Ateşleme bekleme süresini bir zaman adımı kadar azaltır. */
export function tickCooldown(player: Player, dt: number): Player {
  if (player.cooldownRemainingSeconds <= 0) {
    return player;
  }
  return {
    ...player,
    cooldownRemainingSeconds: Math.max(0, player.cooldownRemainingSeconds - dt),
  };
}

/** Aktif buff'ın mühimmatını belirtilen kadar azaltır; mühimmat biterse buff kaldırılır. */
export function consumeBuffCharge(player: Player, amount = 1): Player {
  if (!player.activeBuff) {
    return player;
  }
  const remainingCharges = player.activeBuff.remainingCharges - amount;
  if (remainingCharges <= 0) {
    return { ...player, activeBuff: null };
  }
  return { ...player, activeBuff: { ...player.activeBuff, remainingCharges } };
}

/** Bir power-up alındığında oyuncuya mühimmatlı bir avantaj uygular (önceki buff'ın üzerine yazar). */
export function applyBuff(player: Player, kind: PowerUpKind): Player {
  const buff: PlayerBuff = { kind, remainingCharges: maxChargesForBuffKind(kind) };
  return { ...player, activeBuff: buff };
}

function cooldownForPlayer(player: Player): number {
  return player.activeBuff?.kind === 'rapidFire'
    ? RAPID_FIRE_COOLDOWN_SECONDS
    : FIRE_COOLDOWN_SECONDS;
}

function createBulletsForPlayer(player: Player, nextBulletId: number): Bullet[] {
  const centerX = player.x + player.width / 2 - BULLET_WIDTH / 2;
  const piercing = player.activeBuff?.kind === 'pierce';

  if (player.activeBuff?.kind === 'multiShot') {
    return [
      createBullet(nextBulletId, centerX - MULTI_SHOT_BULLET_OFFSET_PX, player.y, piercing),
      createBullet(nextBulletId + 1, centerX, player.y, piercing),
      createBullet(nextBulletId + 2, centerX + MULTI_SHOT_BULLET_OFFSET_PX, player.y, piercing),
    ];
  }

  return [createBullet(nextBulletId, centerX, player.y, piercing)];
}

/**
 * Ateş tuşu basılıysa ve bekleme süresi dolmuşsa yeni mermi(ler) üretir;
 * aktif buff'a göre hız/mermi sayısı değişir. rapidFire/multiShot/pierce
 * buff'ları her ateşte 1 mühimmat tüketir (shield mühimmatı yalnızca isabet
 * alınca, bkz. state/gameState.ts).
 */
export function tryFireBullet(
  player: Player,
  input: InputSnapshot,
  nextBulletId: number,
): FireResult {
  if (!input.fire || player.cooldownRemainingSeconds > 0) {
    return { player, bullets: [], nextBulletId };
  }

  const bullets = createBulletsForPlayer(player, nextBulletId);
  const cooledPlayer = { ...player, cooldownRemainingSeconds: cooldownForPlayer(player) };
  const isWeaponBuff = player.activeBuff !== null && WEAPON_BUFF_KINDS.has(player.activeBuff.kind);
  const playerAfterFire = isWeaponBuff ? consumeBuffCharge(cooledPlayer) : cooledPlayer;

  return {
    player: playerAfterFire,
    bullets,
    nextBulletId: nextBulletId + bullets.length,
  };
}
