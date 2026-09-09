import type { GameState } from '../state/gameState';
import type { Player, PlayerBuff } from '../entities/player';
import type { Enemy, EnemyKind } from '../entities/enemy';
import type { PowerUp, PowerUpKind } from '../entities/powerUp';
import { maxChargesForBuffKind } from '../systems/shooting';
import type { LevelFlashState } from './levelFlash';
import { levelFlashAlpha } from './levelFlash';

/** Canvas 2D üzerine dokunan tek yer burasıdır; saf değildir ama yalnızca state'i okur. */
export interface RenderContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  shadowColor: string;
  shadowBlur: number;
  globalAlpha: number;
  fillRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
}

const BACKGROUND_COLOR = '#000814';
const STAR_COLOR = '#e0f2ff';
const PLAYER_COLOR = '#39ff88';
const BULLET_COLOR = '#ffe066';
const ENEMY_BULLET_COLOR = '#ff3355';
const PARTICLE_COLOR = '#ffffff';
const SHIELD_RING_COLOR = '#39ff88';
const CHARGE_BAR_TRACK_COLOR = '#1a1a2e';
const CHARGE_BAR_HEIGHT = 3;
const CHARGE_BAR_GAP_ABOVE_SHIP = 8;
const GLOW_BLUR = 6;
const FULL_CIRCLE_RADIANS = Math.PI * 2;

const ENEMY_COLORS: Record<EnemyKind, string> = {
  straight: '#ff4d6d',
  zigzag: '#ffa94d',
  tank: '#c77dff',
  diver: '#ff6b9d',
  boss: '#ff1a4d',
};

const POWER_UP_COLORS: Record<PowerUpKind, string> = {
  rapidFire: '#4dd2ff',
  multiShot: '#f7b32b',
  pierce: '#e0f7ff',
  shield: '#39ff88',
  extraLife: '#ff6b9d',
};

/** Burnu yukarı bakan basit bir vektör gemi çizer (retro arcade tarzı). */
function drawPlayerShip(ctx: RenderContext, player: Player): void {
  const centerX = player.x + player.width / 2;
  const notchY = player.y + player.height * 0.65;

  ctx.beginPath();
  ctx.moveTo(centerX, player.y);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.lineTo(centerX, notchY);
  ctx.lineTo(player.x, player.y + player.height);
  ctx.closePath();
  ctx.fill();
}

/** Aktif silah/kalkan buff'ının kalan mühimmatını geminin hemen üzerinde bir çubukla gösterir. */
function drawBuffChargeBar(ctx: RenderContext, player: Player, buff: PlayerBuff): void {
  const maxCharges = maxChargesForBuffKind(buff.kind);
  const ratio = maxCharges > 0 ? Math.max(0, Math.min(1, buff.remainingCharges / maxCharges)) : 0;
  const barY = player.y - CHARGE_BAR_GAP_ABOVE_SHIP;

  ctx.shadowBlur = 0;
  ctx.fillStyle = CHARGE_BAR_TRACK_COLOR;
  ctx.fillRect(player.x, barY, player.width, CHARGE_BAR_HEIGHT);

  ctx.fillStyle = POWER_UP_COLORS[buff.kind];
  ctx.fillRect(player.x, barY, player.width * ratio, CHARGE_BAR_HEIGHT);
}

/** Standart burnu aşağı bakan vektör gemi (straight/tank tabanı). */
function drawChevron(ctx: RenderContext, enemy: Enemy): void {
  const centerX = enemy.x + enemy.width / 2;
  const notchY = enemy.y + enemy.height * 0.35;

  ctx.beginPath();
  ctx.moveTo(centerX, enemy.y + enemy.height);
  ctx.lineTo(enemy.x + enemy.width, enemy.y);
  ctx.lineTo(centerX, notchY);
  ctx.lineTo(enemy.x, enemy.y);
  ctx.closePath();
  ctx.fill();
}

/** 'zigzag' düşman: dört köşeli döndürülmüş bir elmas — erratik/darting hissi. */
function drawDiamond(ctx: RenderContext, enemy: Enemy): void {
  const centerX = enemy.x + enemy.width / 2;
  const centerY = enemy.y + enemy.height / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, enemy.y);
  ctx.lineTo(enemy.x + enemy.width, centerY);
  ctx.lineTo(centerX, enemy.y + enemy.height);
  ctx.lineTo(enemy.x, centerY);
  ctx.closePath();
  ctx.fill();
}

/** 'diver' düşman: dar, sivri, aerodinamik bir ok — hız/dalış hissi verir. */
function drawDiver(ctx: RenderContext, enemy: Enemy): void {
  const centerX = enemy.x + enemy.width / 2;
  const tipY = enemy.y + enemy.height;
  const finY = enemy.y + enemy.height * 0.3;

  ctx.beginPath();
  ctx.moveTo(centerX, tipY);
  ctx.lineTo(centerX + enemy.width * 0.15, finY);
  ctx.lineTo(centerX + enemy.width * 0.5, enemy.y);
  ctx.lineTo(centerX, enemy.y + enemy.height * 0.15);
  ctx.lineTo(centerX - enemy.width * 0.5, enemy.y);
  ctx.lineTo(centerX - enemy.width * 0.15, finY);
  ctx.closePath();
  ctx.fill();
}

/** 'boss' düşman: geniş kanatlı, büyük ve tehditkar bir gemi silueti. */
function drawBoss(ctx: RenderContext, enemy: Enemy): void {
  const centerX = enemy.x + enemy.width / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, enemy.y + enemy.height);
  ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.25);
  ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.45);
  ctx.lineTo(enemy.x + enemy.width * 0.65, enemy.y);
  ctx.lineTo(centerX, enemy.y + enemy.height * 0.3);
  ctx.lineTo(enemy.x + enemy.width * 0.35, enemy.y);
  ctx.lineTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.45);
  ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.25);
  ctx.closePath();
  ctx.fill();
}

/** Burnu aşağı (oyuncuya doğru) bakan bir vektör düşman gemisi çizer; her tür kendi silüetiyle. */
function drawEnemyShip(ctx: RenderContext, enemy: Enemy): void {
  switch (enemy.kind) {
    case 'zigzag':
      drawDiamond(ctx, enemy);
      return;
    case 'diver':
      drawDiver(ctx, enemy);
      return;
    case 'boss':
      drawBoss(ctx, enemy);
      return;
    case 'tank': {
      drawChevron(ctx, enemy);
      // Ek bir dış hat ile daha "ağır" görünür (yalnızca görsel, hitbox aynı kalır).
      const centerX = enemy.x + enemy.width / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, enemy.y + enemy.height * 0.8);
      ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height * 0.2);
      ctx.lineTo(centerX, enemy.y + enemy.height * 0.5);
      ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height * 0.2);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'straight':
    default:
      drawChevron(ctx, enemy);
  }
}

/** rapidFire/multiShot: döndürülmüş kare (elmas). */
function drawDiamondPowerUp(ctx: RenderContext, powerUp: PowerUp): void {
  const centerX = powerUp.x + powerUp.width / 2;
  const centerY = powerUp.y + powerUp.height / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, powerUp.y);
  ctx.lineTo(powerUp.x + powerUp.width, centerY);
  ctx.lineTo(centerX, powerUp.y + powerUp.height);
  ctx.lineTo(powerUp.x, centerY);
  ctx.closePath();
  ctx.fill();
}

/** pierce: yukarı bakan ince bir ok — delici atışı çağrıştırır. */
function drawPiercePowerUp(ctx: RenderContext, powerUp: PowerUp): void {
  const centerX = powerUp.x + powerUp.width / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, powerUp.y);
  ctx.lineTo(powerUp.x + powerUp.width, powerUp.y + powerUp.height);
  ctx.lineTo(centerX, powerUp.y + powerUp.height * 0.6);
  ctx.lineTo(powerUp.x, powerUp.y + powerUp.height);
  ctx.closePath();
  ctx.fill();
}

/** shield: bir daire — koruma çağrışımı. */
function drawShieldPowerUp(ctx: RenderContext, powerUp: PowerUp): void {
  const centerX = powerUp.x + powerUp.width / 2;
  const centerY = powerUp.y + powerUp.height / 2;
  const radius = Math.min(powerUp.width, powerUp.height) / 2;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, FULL_CIRCLE_RADIANS);
  ctx.fill();
}

/** extraLife: artı/haç işareti — evrensel "can" simgesi. */
function drawExtraLifePowerUp(ctx: RenderContext, powerUp: PowerUp): void {
  const barThickness = powerUp.width * 0.32;
  const centerX = powerUp.x + powerUp.width / 2;
  const centerY = powerUp.y + powerUp.height / 2;

  ctx.fillRect(powerUp.x, centerY - barThickness / 2, powerUp.width, barThickness);
  ctx.fillRect(centerX - barThickness / 2, powerUp.y, barThickness, powerUp.height);
}

function drawPowerUp(ctx: RenderContext, powerUp: PowerUp): void {
  switch (powerUp.kind) {
    case 'pierce':
      drawPiercePowerUp(ctx, powerUp);
      return;
    case 'shield':
      drawShieldPowerUp(ctx, powerUp);
      return;
    case 'extraLife':
      drawExtraLifePowerUp(ctx, powerUp);
      return;
    case 'rapidFire':
    case 'multiShot':
    default:
      drawDiamondPowerUp(ctx, powerUp);
  }
}

export function render(ctx: RenderContext, state: GameState, width: number, height: number): void {
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = STAR_COLOR;
  for (const star of state.stars) {
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  ctx.shadowBlur = GLOW_BLUR;

  for (const enemy of state.enemies) {
    ctx.fillStyle = ENEMY_COLORS[enemy.kind];
    ctx.shadowColor = ENEMY_COLORS[enemy.kind];
    drawEnemyShip(ctx, enemy);
  }

  for (const powerUp of state.powerUps) {
    ctx.fillStyle = POWER_UP_COLORS[powerUp.kind];
    ctx.shadowColor = POWER_UP_COLORS[powerUp.kind];
    drawPowerUp(ctx, powerUp);
  }

  ctx.fillStyle = BULLET_COLOR;
  ctx.shadowColor = BULLET_COLOR;
  for (const bullet of state.bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  ctx.fillStyle = ENEMY_BULLET_COLOR;
  ctx.shadowColor = ENEMY_BULLET_COLOR;
  for (const enemyBullet of state.enemyBullets) {
    ctx.fillRect(enemyBullet.x, enemyBullet.y, enemyBullet.width, enemyBullet.height);
  }

  ctx.fillStyle = PLAYER_COLOR;
  ctx.shadowColor = PLAYER_COLOR;
  drawPlayerShip(ctx, state.player);

  if (state.player.activeBuff?.kind === 'shield') {
    const centerX = state.player.x + state.player.width / 2;
    const centerY = state.player.y + state.player.height / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, state.player.width * 0.75, 0, FULL_CIRCLE_RADIANS);
    ctx.strokeStyle = SHIELD_RING_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (state.player.activeBuff) {
    drawBuffChargeBar(ctx, state.player, state.player.activeBuff);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = PARTICLE_COLOR;
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, 1 - particle.ageSeconds / particle.lifeSeconds);
    ctx.fillRect(particle.x, particle.y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

const LEVEL_FLASH_MAX_ALPHA = 0.35;

/**
 * Seviye atlama anında tüm sahneyi kısa süreliğine renkli bir tonla kaplar —
 * oyunu durdurmadan geçişi "hissettiren" bir görsel vurgu. `render()`'dan
 * sonra çağrılır çünkü GameState'in değil, oyun döngüsü zamanlamasının parçasıdır
 * (bkz. screenShake ile aynı desen).
 */
export function drawLevelFlash(
  ctx: RenderContext,
  width: number,
  height: number,
  flash: LevelFlashState | null,
): void {
  if (!flash) {
    return;
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = levelFlashAlpha(flash, LEVEL_FLASH_MAX_ALPHA);
  ctx.fillStyle = `hsl(${flash.hue}, 90%, 60%)`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}
