import { describe, expect, it } from 'vitest';
import { detectAndParseImport } from '@/lib/import-parsers';

const SECRET = 'JBSWY3DPEHPK3PXP';
const GITHUB_URI = `otpauth://totp/GitHub:user@example.com?secret=${SECRET}&issuer=GitHub`;
const AWS_URI = `otpauth://totp/AWS:admin@corp.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=AWS`;

describe('detectAndParseImport — TOKEY plaintext JSON', () => {
  it('normalizes tokens and fills defaults', () => {
    const content = JSON.stringify({
      appName: 'TOKEY',
      tokens: [{ issuer: 'GitHub', account: 'user@example.com', secret: SECRET }],
    });

    const result = detectAndParseImport(content);
    expect(result.format).toBe('tokey-json');
    expect(result.error).toBeUndefined();
    expect(result.tokens).toHaveLength(1);

    const token = result.tokens[0];
    expect(token.issuer).toBe('GitHub');
    expect(token.secret).toBe(SECRET);
    expect(token.category).toBe('Personal');
    expect(token.type).toBe('totp');
    expect(token.algorithm).toBe('SHA1');
    expect(token.digits).toBe(6);
    expect(token.period).toBe(30);
    expect(token.id).toMatch(/^tokey-/);
  });
});

describe('detectAndParseImport — Ente unencrypted export', () => {
  it('parses items[].code and preserves pinned state', () => {
    const content = JSON.stringify({
      version: 1,
      app: 'ente-auth',
      items: [
        { code: GITHUB_URI, pinned: true },
        { code: AWS_URI, pinned: false },
      ],
    });

    const result = detectAndParseImport(content);
    expect(result.format).toBe('ente-export');
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].issuer).toBe('GitHub');
    expect(result.tokens[0].isPinned).toBe(true);
    expect(result.tokens[1].isPinned).toBe(false);
  });

  it('skips items without a valid code', () => {
    const content = JSON.stringify({ items: [{ code: null }, { code: 'garbage' }] });
    const result = detectAndParseImport(content);
    expect(result.format).toBe('ente-export');
    expect(result.tokens).toHaveLength(0);
  });
});

describe('detectAndParseImport — Ente encrypted export', () => {
  it('is rejected with a helpful error', () => {
    const content = JSON.stringify({
      version: 1,
      kdfParams: { memLimit: 4096, opsLimit: 3, salt: 'abc' },
      encryptedData: 'x',
      encryptionNonce: 'y',
    });

    const result = detectAndParseImport(content);
    expect(result.format).toBe('ente-encrypted');
    expect(result.tokens).toHaveLength(0);
    expect(result.error).toContain('ENCRYPTED');
    expect(result.error).toContain('unencrypted');
  });
});

describe('detectAndParseImport — plain text otpauth URIs', () => {
  it('parses newline and comma separated URIs', () => {
    const content = [GITHUB_URI, AWS_URI, GITHUB_URI].join(',\n');

    const result = detectAndParseImport(content);
    expect(result.format).toBe('plain-text');
    expect(result.tokens).toHaveLength(3);
    expect(result.tokens[0].issuer).toBe('GitHub');
    expect(result.tokens[2].account).toBe('user@example.com');
  });

  it('ignores non-URI junk lines', () => {
    const result = detectAndParseImport(`random note\n${GITHUB_URI}\nanother line`);
    expect(result.format).toBe('plain-text');
    expect(result.tokens).toHaveLength(1);
  });
});

describe('detectAndParseImport — generic JSON array fallback', () => {
  it('maps secret/label/type/algorithm fields with normalization', () => {
    const content = JSON.stringify([
      { secret: SECRET, issuer: 'Test', label: 'user@x.com', type: 'TOTP', algorithm: 'SHA-256', digits: 8, period: 60 },
    ]);

    const result = detectAndParseImport(content);
    expect(result.format).toBe('generic-json');
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].algorithm).toBe('SHA256');
    expect(result.tokens[0].digits).toBe(8);
    expect(result.tokens[0].period).toBe(60);
    expect(result.tokens[0].account).toBe('user@x.com');
  });
});

describe('detectAndParseImport — unknown input', () => {
  it('returns unknown for empty content', () => {
    expect(detectAndParseImport('').format).toBe('unknown');
    expect(detectAndParseImport('   \n  ').format).toBe('unknown');
  });

  it('returns unknown for unrecognizable text', () => {
    const result = detectAndParseImport('hello world this is not a backup');
    expect(result.format).toBe('unknown');
    expect(result.tokens).toHaveLength(0);
  });

  it('returns unknown for JSON objects with no known shape', () => {
    const result = detectAndParseImport(JSON.stringify({ foo: 'bar' }));
    expect(result.format).toBe('unknown');
  });
});
