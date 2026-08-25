import { GoogleMigrationAccount, OtpAlgorithm, OtpType, Token } from './types';
import { isValidBase32, parseOtpAuthUri, sanitizeBase32Secret } from './otp';
import { parseGoogleMigrationUri } from './google-migration';

export type DetectedBackupFormat =
  | 'tokey-encrypted'
  | 'ente-encrypted'
  | 'ente-export'
  | 'tokey-json'
  | 'generic-json'
  | 'plain-text'
  | 'unknown';

export interface ImportParseResult {
  format: DetectedBackupFormat;
  tokens: Token[];
  error?: string;
}

const ENTE_ENCRYPTED_ERROR =
  'This is an Ente ENCRYPTED export (password protected). TOKEY only imports Ente unencrypted exports. In Ente, use Settings > Data > Export codes (unencrypted), or decrypt the file with the Ente CLI first.';

// Build a fully-formed Token from a partial record + import defaults
function createImportedToken(partial: Partial<Token>): Token | null {
  const secret = sanitizeBase32Secret(partial.secret || '');
  if (!secret || !isValidBase32(secret)) return null;

  const now = Date.now();
  const type: OtpType = partial.type === 'hotp' ? 'hotp' : 'totp';

  return {
    id: `tokey-${now}-${Math.random().toString(36).slice(2, 8)}`,
    issuer: (partial.issuer || '').trim() || 'Unknown Service',
    account: (partial.account || '').trim() || 'Account',
    secret,
    type,
    algorithm: partial.algorithm || 'SHA1',
    digits: partial.digits || 6,
    period: partial.period || 30,
    counter: type === 'hotp' ? partial.counter || 0 : undefined,
    category: partial.category || 'Personal',
    isPinned: partial.isPinned ?? false,
    createdAt: partial.createdAt || now,
    updatedAt: partial.updatedAt || now,
  };
}

// Map a decoded Google Authenticator migration account to a Token
function tokenFromGoogleMigration(acc: GoogleMigrationAccount): Token | null {
  return createImportedToken({
    issuer: acc.issuer,
    account: acc.name,
    secret: acc.secret,
    type: acc.type,
    algorithm: acc.algorithm,
    digits: acc.digits,
    period: 30,
    counter: acc.counter,
  });
}

// Ente unencrypted export: { items: [{ code: 'otpauth://…', pinned }] }
function parseEnteExport(json: any): ImportParseResult {
  const items = Array.isArray(json?.items) ? json.items : [];
  const tokens: Token[] = [];

  for (const item of items) {
    const code = typeof item === 'string' ? item : item?.code;
    if (!code) continue;
    const parsed = parseOtpAuthUri(code);
    if (!parsed) continue;

    // Preserve ente's pin state where provided
    const token = createImportedToken({
      ...parsed,
      isPinned: item.pinned === true ? true : undefined,
    });
    if (token) tokens.push(token);
  }

  return { format: 'ente-export', tokens };
}

// Plain text: one otpauth URI per line, comma or newline separated.
// otpauth-migration:// lines expand into batch imports.
function parsePlainText(content: string): ImportParseResult {
  const lines = content
    .split(/[\r\n]+/)
    .flatMap((line) => line.split(','))
    .map((line) => line.trim())
    .filter(Boolean);

  const tokens: Token[] = [];
  for (const line of lines) {
    if (line.startsWith('otpauth-migration://')) {
      for (const acc of parseGoogleMigrationUri(line)) {
        const token = tokenFromGoogleMigration(acc);
        if (token) tokens.push(token);
      }
      continue;
    }
    if (line.startsWith('otpauth://')) {
      const parsed = parseOtpAuthUri(line);
      if (!parsed) continue;
      const token = createImportedToken(parsed);
      if (token) tokens.push(token);
    }
  }

  return { format: tokens.length > 0 ? 'plain-text' : 'unknown', tokens };
}

// Generic JSON array fallback: items carrying a Base32 `secret` field
function parseGenericJsonArray(items: any[]): ImportParseResult {
  const tokens: Token[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    let algorithm: OtpAlgorithm | undefined;
    const rawAlgo = String(item.algorithm || '').toUpperCase().replace(/[-\s]/g, '');
    if (rawAlgo === 'SHA1') algorithm = 'SHA1';
    else if (rawAlgo === 'SHA256') algorithm = 'SHA256';
    else if (rawAlgo === 'SHA512') algorithm = 'SHA512';

    const rawType = String(item.type || '').toLowerCase();
    const digitsRaw = parseInt(item.digits, 10);
    const periodRaw = parseInt(item.period, 10);
    const counterRaw = parseInt(item.counter, 10);

    const token = createImportedToken({
      issuer: item.issuer || item.service || '',
      account: item.account || item.label || item.email || item.user || item.name || '',
      secret: item.secret,
      type: rawType.includes('hotp') ? 'hotp' : 'totp',
      algorithm,
      digits: isNaN(digitsRaw) ? undefined : digitsRaw,
      period: isNaN(periodRaw) ? undefined : periodRaw,
      counter: isNaN(counterRaw) ? undefined : counterRaw,
      category: item.category,
    });
    if (token) tokens.push(token);
  }

  return { format: 'generic-json', tokens };
}

// Normalize a full/partial TOKEY token list (older backups may miss fields)
function normalizeTokeyTokens(rawTokens: any[]): ImportParseResult {
  const tokens: Token[] = [];
  for (const t of rawTokens) {
    if (!t || typeof t !== 'object') continue;
    const token = createImportedToken(t as Partial<Token>);
    if (token) tokens.push({ ...token, ...(t.id ? { id: t.id } : {}) });
  }
  return { format: 'tokey-json', tokens };
}

// Auto-detect the backup format and convert it to tokens
export function detectAndParseImport(content: string): ImportParseResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return { format: 'unknown', tokens: [] };
  }

  // JSON formats
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed);

      if (json && !Array.isArray(json)) {
        // TOKEY encrypted backup — handled separately by the password flow
        if (json.appName === 'TOKEY_ENCRYPTED') {
          return { format: 'tokey-encrypted', tokens: [] };
        }

        // Ente encrypted export — intentionally unsupported
        if (json.kdfParams && json.encryptedData) {
          return { format: 'ente-encrypted', tokens: [], error: ENTE_ENCRYPTED_ERROR };
        }

        // Ente unencrypted export
        if (Array.isArray(json.items)) {
          return parseEnteExport(json);
        }

        // TOKEY plaintext backup
        if (Array.isArray(json.tokens)) {
          return normalizeTokeyTokens(json.tokens);
        }
      }

      // Bare array of token-like objects
      if (Array.isArray(json)) {
        return parseGenericJsonArray(json);
      }
    } catch {
      // Not valid JSON — fall through to plain-text parsing
    }
  }

  // Plain-text otpauth URIs
  return parsePlainText(trimmed);
}
