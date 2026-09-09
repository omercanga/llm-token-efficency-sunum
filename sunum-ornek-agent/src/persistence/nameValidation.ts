import { MAX_PLAYER_NAME_LENGTH } from '../config/constants';

/** docs/SECURITY.md — yalnızca harf, rakam ve boşluk; kırpma yapılmaz, geçersiz girdi reddedilir. */
const ALLOWED_NAME_PATTERN = /^[A-Za-z0-9 ]+$/;

export type NameValidationFailureReason = 'empty' | 'tooLong' | 'invalidCharacters';

export type NameValidationResult =
  | { readonly valid: true; readonly name: string }
  | { readonly valid: false; readonly reason: NameValidationFailureReason };

/**
 * Oyuncu ismini doğrular. Yalnızca baştaki/sondaki boşluklar kırpılır
 * (kullanıcı deneyimi); geçersiz karakterler sessizce temizlenmez —
 * girdi olduğu gibi reddedilir ki kullanıcı ne yazdığını görebilsin.
 */
export function validatePlayerName(rawName: string): NameValidationResult {
  const trimmed = rawName.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty' };
  }
  if (trimmed.length > MAX_PLAYER_NAME_LENGTH) {
    return { valid: false, reason: 'tooLong' };
  }
  if (!ALLOWED_NAME_PATTERN.test(trimmed)) {
    return { valid: false, reason: 'invalidCharacters' };
  }

  return { valid: true, name: trimmed };
}

const FAILURE_MESSAGES: Record<NameValidationFailureReason, string> = {
  empty: 'İsim boş olamaz.',
  tooLong: `İsim en fazla ${MAX_PLAYER_NAME_LENGTH} karakter olabilir.`,
  invalidCharacters: 'Yalnızca harf, rakam ve boşluk kullanılabilir.',
};

export function describeNameValidationFailure(reason: NameValidationFailureReason): string {
  return FAILURE_MESSAGES[reason];
}
