import { describe, expect, it } from 'vitest';
import {
  createCsvBackup,
  createPlaintextJsonBackup,
  mergeTokens,
  restoreEncryptedBackup,
} from '@/lib/cloud-sync';
import { Token } from '@/lib/types';

function makeToken(partial: Partial<Token>): Token {
  return {
    id: partial.id || `tokey-test-${Math.random().toString(36).slice(2, 8)}`,
    issuer: partial.issuer || 'GitHub',
    account: partial.account || 'user@example.com',
    secret: partial.secret || 'JBSWY3DPEHPK3PXP',
    type: partial.type || 'totp',
    algorithm: partial.algorithm || 'SHA1',
    digits: partial.digits || 6,
    period: partial.period || 30,
    counter: partial.counter,
    category: partial.category || 'Personal',
    isPinned: partial.isPinned ?? false,
    createdAt: partial.createdAt ?? 1000,
    updatedAt: partial.updatedAt ?? 1000,
  };
}

describe('mergeTokens', () => {
  it('adds new tokens and generates missing ids', () => {
    const existing = [makeToken({})];
    const incoming = [
      makeToken({ issuer: 'AWS', account: 'admin@corp.com', secret: 'GEZDGNBVGY3TQOJQ' }),
    ];

    const { merged, addedCount, updatedCount } = mergeTokens(existing, incoming);
    expect(addedCount).toBe(1);
    expect(updatedCount).toBe(0);
    expect(merged).toHaveLength(2);
    expect(merged[1].id).toMatch(/^tokey-/);
  });

  it('deduplicates case-insensitively on issuer/account + secret', () => {
    const existing = [makeToken({ issuer: 'github', account: 'USER@example.com' })];
    const incoming = [makeToken({ issuer: 'GitHub', account: 'user@example.com', updatedAt: 5000 })];

    const { merged, addedCount, updatedCount } = mergeTokens(existing, incoming);
    expect(addedCount).toBe(0);
    expect(updatedCount).toBe(1);
    expect(merged).toHaveLength(1);
  });

  it('does not update when the incoming copy is older', () => {
    const existing = [makeToken({ issuer: 'GitHub', updatedAt: 9000 })];
    const incoming = [makeToken({ issuer: 'GitHub', updatedAt: 1000 })];

    const { addedCount, updatedCount } = mergeTokens(existing, incoming);
    expect(addedCount).toBe(0);
    expect(updatedCount).toBe(0);
  });
});

describe('createCsvBackup', () => {
  it('emits a header row and escaped values', () => {
    const csv = createCsvBackup([
      makeToken({ issuer: 'My "Issuer"', account: 'a,b@c.com', isPinned: true }),
    ]);

    const lines = csv.split('\n');
    expect(lines[0]).toContain('Issuer');
    expect(lines[0]).toContain('Secret');
    expect(lines[1]).toContain('"My ""Issuer"""');
    expect(lines[1]).toContain('"a,b@c.com"');
    expect(lines[1].endsWith(',true')).toBe(true);
  });
});

describe('createPlaintextJsonBackup', () => {
  it('wraps tokens in a TOKEY payload', () => {
    const tokens = [makeToken({}), makeToken({ issuer: 'AWS' })];
    const json = JSON.parse(createPlaintextJsonBackup(tokens));

    expect(json.appName).toBe('TOKEY');
    expect(json.version).toBe(1);
    expect(json.exportedAt).toBeTruthy();
    expect(json.tokens).toHaveLength(2);
  });
});

describe('restoreEncryptedBackup validation', () => {
  it('rejects files that are not TOKEY encrypted backups', async () => {
    const bad = JSON.stringify({ appName: 'OTHER', cipherText: 'x' });
    await expect(restoreEncryptedBackup(bad, 'pw')).rejects.toThrow('Invalid TOKEY');
  });

  it('rejects malformed JSON input with a parse error', async () => {
    await expect(restoreEncryptedBackup('not-json', 'pw')).rejects.toThrow();
  });
});
