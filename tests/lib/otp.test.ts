import { describe, expect, it } from 'vitest';
import {
  base32ToBytes,
  bytesToBase32,
  isValidBase32,
  parseOtpAuthUri,
  sanitizeBase32Secret,
} from '@/lib/otp';

describe('sanitizeBase32Secret', () => {
  it('uppercases and strips spaces, hyphens and underscores', () => {
    expect(sanitizeBase32Secret('jbsw y3dp-e hpk_3pxp')).toBe('JBSWY3DPEHPK3PXP');
  });

  it('removes characters outside the Base32 alphabet', () => {
    expect(sanitizeBase32Secret('AB1C0D89')).toBe('ABCD');
  });

  it('returns empty string for falsy input', () => {
    expect(sanitizeBase32Secret('')).toBe('');
  });
});

describe('isValidBase32', () => {
  it('accepts a standard secret', () => {
    expect(isValidBase32('JBSWY3DPEHPK3PXP')).toBe(true);
  });

  it('accepts secrets with padding', () => {
    expect(isValidBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ====')).toBe(true);
  });

  it('strips out-of-alphabet digits before validating', () => {
    // 'ABC1' -> 'ABC' is too short, so invalid
    expect(isValidBase32('ABC1')).toBe(false);
    // 'HELLO09' -> 'HELLO' survives sanitisation and is valid
    expect(isValidBase32('HELLO09')).toBe(true);
  });

  it('rejects strings shorter than 4 characters', () => {
    expect(isValidBase32('AB')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(isValidBase32('')).toBe(false);
  });
});

describe('bytesToBase32 / base32ToBytes', () => {
  it('encodes a single byte', () => {
    expect(bytesToBase32(new Uint8Array([0]))).toBe('AA');
    expect(bytesToBase32(new Uint8Array([255]))).toBe('74');
  });

  it('round-trips a standard secret', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    expect(bytesToBase32(base32ToBytes(secret))).toBe(secret);
  });

  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(base32ToBytes(bytesToBase32(bytes))).toEqual(bytes);
  });
});

describe('parseOtpAuthUri', () => {
  it('parses a TOTP URI with issuer prefix in the label', () => {
    const result = parseOtpAuthUri(
      'otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub'
    );
    expect(result).not.toBeNull();
    expect(result!.issuer).toBe('GitHub');
    expect(result!.account).toBe('user@example.com');
    expect(result!.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(result!.type).toBe('totp');
    expect(result!.digits).toBe(6);
    expect(result!.period).toBe(30);
  });

  it('parses algorithm and digit overrides', () => {
    const result = parseOtpAuthUri(
      'otpauth://totp/Test:acct?secret=JBSWY3DPEHPK3PXP&algorithm=SHA512&digits=8&period=60'
    );
    expect(result!.algorithm).toBe('SHA512');
    expect(result!.digits).toBe(8);
    expect(result!.period).toBe(60);
  });

  it('parses an HOTP URI with counter', () => {
    const result = parseOtpAuthUri(
      'otpauth://hotp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP&counter=5&issuer=GitHub'
    );
    expect(result!.type).toBe('hotp');
    expect(result!.counter).toBe(5);
  });

  it('returns null for non-otpauth input', () => {
    expect(parseOtpAuthUri('https://example.com')).toBeNull();
    expect(parseOtpAuthUri('not a uri')).toBeNull();
  });
});
