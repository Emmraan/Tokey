'use client';

import { Token, EncryptedBackupFile, BackupPayload } from './types';
import { encryptWithPassword, decryptWithPassword } from './crypto';

// Export encrypted backup JSON
export async function createEncryptedBackup(tokens: Token[], masterPassword: string): Promise<string> {
  const payload: BackupPayload = {
    version: 1,
    appName: 'TOKEY',
    exportedAt: new Date().toISOString(),
    tokens,
  };

  const plainText = JSON.stringify(payload);
  const { cipherText, ivHex, saltHex } = await encryptWithPassword(plainText, masterPassword);

  const backupFile: EncryptedBackupFile = {
    version: 1,
    appName: 'TOKEY_ENCRYPTED',
    saltHex,
    ivHex,
    cipherText,
    exportedAt: payload.exportedAt,
  };

  return JSON.stringify(backupFile, null, 2);
}

// Restore encrypted backup JSON
export async function restoreEncryptedBackup(jsonString: string, password: string): Promise<Token[]> {
  const backupFile = JSON.parse(jsonString) as EncryptedBackupFile;
  if (backupFile.appName !== 'TOKEY_ENCRYPTED' || !backupFile.cipherText) {
    throw new Error('Invalid TOKEY encrypted backup file format.');
  }

  const decryptedJson = await decryptWithPassword(
    backupFile.cipherText,
    backupFile.ivHex,
    backupFile.saltHex,
    password
  );

  const payload = JSON.parse(decryptedJson) as BackupPayload;
  if (!payload.tokens || !Array.isArray(payload.tokens)) {
    throw new Error('Corrupted or invalid token payload inside backup.');
  }

  return payload.tokens;
}

// Export plaintext JSON
export function createPlaintextJsonBackup(tokens: Token[]): string {
  const payload: BackupPayload = {
    version: 1,
    appName: 'TOKEY',
    exportedAt: new Date().toISOString(),
    tokens,
  };
  return JSON.stringify(payload, null, 2);
}

// Export CSV
export function createCsvBackup(tokens: Token[]): string {
  const headers = ['Issuer', 'Account', 'Secret', 'Type', 'Algorithm', 'Digits', 'Period', 'Counter', 'Category', 'Pinned'];
  const rows = tokens.map((t) => [
    `"${(t.issuer || '').replace(/"/g, '""')}"`,
    `"${(t.account || '').replace(/"/g, '""')}"`,
    `"${(t.secret || '').replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.algorithm || 'SHA1'}"`,
    t.digits || 6,
    t.period || 30,
    t.counter || 0,
    `"${(t.category || 'General').replace(/"/g, '""')}"`,
    t.isPinned ? 'true' : 'false',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Download file utility
export function downloadFile(content: string, fileName: string, contentType: string = 'application/json') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Merge tokens without duplication (by secret and issuer)
export function mergeTokens(existing: Token[], incoming: Token[]): { merged: Token[]; addedCount: number; updatedCount: number } {
  const map = new Map<string, Token>();
  let addedCount = 0;
  let updatedCount = 0;

  for (const token of existing) {
    const key = `${token.issuer.toLowerCase()}:${token.account.toLowerCase()}:${token.secret}`;
    map.set(key, token);
  }

  for (const token of incoming) {
    const key = `${token.issuer.toLowerCase()}:${token.account.toLowerCase()}:${token.secret}`;
    if (map.has(key)) {
      const existingToken = map.get(key)!;
      // update if incoming is newer
      if (token.updatedAt && token.updatedAt > (existingToken.updatedAt || 0)) {
        map.set(key, { ...existingToken, ...token });
        updatedCount++;
      }
    } else {
      map.set(key, {
        ...token,
        id: token.id || `tokey-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: token.createdAt || Date.now(),
        updatedAt: token.updatedAt || Date.now(),
      });
      addedCount++;
    }
  }

  return {
    merged: Array.from(map.values()),
    addedCount,
    updatedCount,
  };
}
