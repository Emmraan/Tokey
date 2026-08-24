import * as OTPAuth from 'otpauth';
import { Token, OtpAlgorithm, OtpType } from './types';

// Base32 Alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function sanitizeBase32Secret(raw: string): string {
  if (!raw) return '';
  return raw
    .toUpperCase()
    .replace(/[\s\-_]/g, '')
    .replace(/[^A-Z2-7]/g, '');
}

export function isValidBase32(secret: string): boolean {
  const clean = sanitizeBase32Secret(secret);
  if (!clean || clean.length < 4) return false;
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(clean);
}

// Convert bytes to Base32 string
export function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

// Convert Base32 string to bytes
export function base32ToBytes(base32: string): Uint8Array {
  const clean = sanitizeBase32Secret(base32);
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export interface TotpGenerationResult {
  code: string;
  remainingSeconds: number;
  period: number;
  progress: number; // 0 to 1 (1 = fresh, 0 = expired)
  nextCode?: string;
}

export function generateTotp(token: Token, timestampMs: number = Date.now()): TotpGenerationResult {
  const period = token.period || 30;
  const digits = token.digits || 6;
  const algorithm = token.algorithm || 'SHA1';
  const cleanSecret = sanitizeBase32Secret(token.secret);

  if (!cleanSecret) {
    return {
      code: '------'.slice(0, digits),
      remainingSeconds: 0,
      period,
      progress: 0,
    };
  }

  try {
    const totp = new OTPAuth.TOTP({
      issuer: token.issuer || 'TOKEY',
      label: token.account || 'Account',
      algorithm: algorithm,
      digits: digits,
      period: period,
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
    });

    const timestampSec = Math.floor(timestampMs / 1000);
    const code = totp.generate({ timestamp: timestampMs });
    
    // Also compute next upcoming code for seamless transition
    const nextCode = totp.generate({ timestamp: timestampMs + period * 1000 });

    const elapsedInPeriod = timestampSec % period;
    const remainingSeconds = period - elapsedInPeriod;
    const progress = remainingSeconds / period;

    return {
      code: code.padStart(digits, '0'),
      remainingSeconds,
      period,
      progress,
      nextCode: nextCode.padStart(digits, '0'),
    };
  } catch (err) {
    console.error('Error generating TOTP:', err);
    return {
      code: '------'.slice(0, digits),
      remainingSeconds: 0,
      period,
      progress: 0,
    };
  }
}

export function generateHotp(token: Token, counter: number = token.counter || 0): string {
  const digits = token.digits || 6;
  const algorithm = token.algorithm || 'SHA1';
  const cleanSecret = sanitizeBase32Secret(token.secret);

  if (!cleanSecret) {
    return '------'.slice(0, digits);
  }

  try {
    const hotp = new OTPAuth.HOTP({
      issuer: token.issuer || 'TOKEY',
      label: token.account || 'Account',
      algorithm: algorithm,
      digits: digits,
      counter: counter,
      secret: OTPAuth.Secret.fromBase32(cleanSecret),
    });

    return hotp.generate({ counter }).padStart(digits, '0');
  } catch (err) {
    console.error('Error generating HOTP:', err);
    return '------'.slice(0, digits);
  }
}

export function parseOtpAuthUri(uriString: string): Partial<Token> | null {
  try {
    const cleanUri = uriString.trim();
    if (!cleanUri.startsWith('otpauth://')) {
      return null;
    }

    const parsed = OTPAuth.URI.parse(cleanUri);
    const isTotp = parsed instanceof OTPAuth.TOTP;

    let algorithm: OtpAlgorithm = 'SHA1';
    if (parsed.algorithm === 'SHA256') algorithm = 'SHA256';
    else if (parsed.algorithm === 'SHA512') algorithm = 'SHA512';

    const secret = parsed.secret.base32;
    const issuer = parsed.issuer || '';
    let account = parsed.label || '';

    // If label contains "Issuer:Account", strip duplicate issuer
    if (account.includes(':')) {
      const parts = account.split(':');
      if (!issuer) {
        // use first part as issuer
      }
      account = parts.slice(1).join(':').trim();
    }

    const token: Partial<Token> = {
      issuer: issuer || 'Unknown Service',
      account: account || 'Account',
      secret: secret,
      type: isTotp ? 'totp' : 'hotp',
      algorithm: algorithm,
      digits: parsed.digits || 6,
      period: isTotp ? (parsed as OTPAuth.TOTP).period || 30 : 30,
      counter: !isTotp ? (parsed as OTPAuth.HOTP).counter || 0 : undefined,
    };

    return token;
  } catch (err) {
    // Fallback manual URL parser if OTPAuth.URI fails
    try {
      const url = new URL(uriString);
      if (url.protocol !== 'otpauth:') return null;

      const type: OtpType = url.host === 'hotp' ? 'hotp' : 'totp';
      let path = decodeURIComponent(url.pathname.replace(/^\//, ''));
      let issuer = url.searchParams.get('issuer') || '';
      let account = path;

      if (path.includes(':')) {
        const parts = path.split(':');
        if (!issuer) issuer = parts[0];
        account = parts[1];
      }

      const secret = url.searchParams.get('secret') || '';
      const algorithmRaw = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase();
      let algorithm: OtpAlgorithm = 'SHA1';
      if (algorithmRaw === 'SHA256') algorithm = 'SHA256';
      if (algorithmRaw === 'SHA512') algorithm = 'SHA512';

      const digits = parseInt(url.searchParams.get('digits') || '6', 10);
      const period = parseInt(url.searchParams.get('period') || '30', 10);
      const counter = parseInt(url.searchParams.get('counter') || '0', 10);

      return {
        issuer: issuer.trim(),
        account: account.trim(),
        secret: sanitizeBase32Secret(secret),
        type,
        algorithm,
        digits: isNaN(digits) ? 6 : digits,
        period: isNaN(period) ? 30 : period,
        counter: type === 'hotp' ? (isNaN(counter) ? 0 : counter) : undefined,
      };
    } catch (manualErr) {
      console.error('Failed to parse OTP URI:', manualErr);
      return null;
    }
  }
}

export function buildOtpAuthUri(token: Token): string {
  const cleanSecret = sanitizeBase32Secret(token.secret);
  const issuer = encodeURIComponent(token.issuer || 'TOKEY');
  const account = encodeURIComponent(token.account || 'Account');
  const label = issuer ? `${issuer}:${account}` : account;

  const params = new URLSearchParams();
  params.set('secret', cleanSecret);
  if (token.issuer) params.set('issuer', token.issuer);
  if (token.algorithm && token.algorithm !== 'SHA1') params.set('algorithm', token.algorithm);
  if (token.digits && token.digits !== 6) params.set('digits', token.digits.toString());
  
  if (token.type === 'totp') {
    if (token.period && token.period !== 30) params.set('period', token.period.toString());
    return `otpauth://totp/${label}?${params.toString()}`;
  } else {
    params.set('counter', (token.counter || 0).toString());
    return `otpauth://hotp/${label}?${params.toString()}`;
  }
}
