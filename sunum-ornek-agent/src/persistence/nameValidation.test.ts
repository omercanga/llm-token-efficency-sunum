import { describe, expect, it } from 'vitest';
import { describeNameValidationFailure, validatePlayerName } from './nameValidation';
import { MAX_PLAYER_NAME_LENGTH } from '../config/constants';

describe('validatePlayerName', () => {
  it('geçerli bir ismi kabul eder', () => {
    expect(validatePlayerName('Ada')).toEqual({ valid: true, name: 'Ada' });
  });

  it('baştaki ve sondaki boşlukları kırpar', () => {
    expect(validatePlayerName('  Ada  ')).toEqual({ valid: true, name: 'Ada' });
  });

  it('boş girdiyi reddeder', () => {
    expect(validatePlayerName('')).toEqual({ valid: false, reason: 'empty' });
  });

  it('yalnızca boşluktan oluşan girdiyi reddeder', () => {
    expect(validatePlayerName('   ')).toEqual({ valid: false, reason: 'empty' });
  });

  it(`${MAX_PLAYER_NAME_LENGTH} karakterden uzun ismi reddeder`, () => {
    const tooLong = 'a'.repeat(MAX_PLAYER_NAME_LENGTH + 1);
    expect(validatePlayerName(tooLong)).toEqual({ valid: false, reason: 'tooLong' });
  });

  it(`tam olarak ${MAX_PLAYER_NAME_LENGTH} karakteri kabul eder`, () => {
    const exact = 'a'.repeat(MAX_PLAYER_NAME_LENGTH);
    expect(validatePlayerName(exact)).toEqual({ valid: true, name: exact });
  });

  it('izin verilmeyen karakter içeren ismi sessizce temizlemez, reddeder', () => {
    expect(validatePlayerName('<script>')).toEqual({
      valid: false,
      reason: 'invalidCharacters',
    });
  });

  it('XSS denemesi içeren bir ismi reddeder', () => {
    const result = validatePlayerName('<img src=x onerror=alert(1)>');
    expect(result.valid).toBe(false);
  });

  it('rakam ve boşluk içeren geçerli bir ismi kabul eder', () => {
    expect(validatePlayerName('Player 1')).toEqual({ valid: true, name: 'Player 1' });
  });
});

describe('describeNameValidationFailure', () => {
  it('her hata nedeni için kullanıcıya gösterilecek bir mesaj döner', () => {
    expect(describeNameValidationFailure('empty')).toMatch(/boş/i);
    expect(describeNameValidationFailure('tooLong')).toContain(String(MAX_PLAYER_NAME_LENGTH));
    expect(describeNameValidationFailure('invalidCharacters')).toMatch(/karakter|harf/i);
  });
});
