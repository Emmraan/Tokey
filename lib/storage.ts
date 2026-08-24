'use client';

import { get, set, del } from 'idb-keyval';
import { Token, VaultSettings } from './types';
import {
  deriveKey,
  encryptData,
  decryptData,
  computeHash,
  generateRandomBytes,
  bufferToHex,
  hexToBuffer,
} from './crypto';

const STORAGE_KEYS = {
  SETTINGS: 'tokey_vault_settings',
  UNENCRYPTED_TOKENS: 'tokey_unencrypted_tokens',
  LOCAL_SESSION_KEY: 'tokey_session_key',
};

const DEFAULT_SETTINGS: VaultSettings = {
  hasPassword: false,
  saltHex: '',
  ivHex: '',
  autoLockMinutes: 5,
  privacyMaskEnabled: false,
  compactView: false,
  soundEnabled: true,
  hapticEnabled: true,
  allowBiometrics: false,
  theme: 'dark',
  cloudSyncEnabled: false,
};

// Starter demo tokens for initial first-time load
export const SAMPLE_TOKENS: Token[] = [
  {
    id: 'tokey-sample-1',
    issuer: 'GitHub',
    account: 'alex.developer@octocat.io',
    secret: 'JBSWY3DPEHPK3PXP', // standard test secret
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    category: 'Work',
    isPinned: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'tokey-sample-2',
    issuer: 'Google',
    account: 'alex.security@gmail.com',
    secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    category: 'Personal',
    isPinned: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'tokey-sample-3',
    issuer: 'AWS',
    account: 'root-prod-cloud',
    secret: 'NBSWY3DPEHPK3PXPNBSWY3DPEHPK3PXP',
    type: 'totp',
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    category: 'Work',
    isPinned: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'tokey-sample-4',
    issuer: 'Binance',
    account: 'trader_vault_99',
    secret: 'KRUGS4ZANFZSAYJA',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    category: 'Finance',
    isPinned: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'tokey-sample-5',
    issuer: 'Discord',
    account: 'CyberGuardian#4096',
    secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    category: 'Social',
    isPinned: false,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'tokey-sample-6',
    issuer: 'Internal Server Counter',
    account: 'hotp-admin-key',
    secret: 'MZXW6YTBOI======',
    type: 'hotp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    counter: 12,
    category: 'Work',
    isPinned: false,
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000,
  },
];

export async function loadVaultSettings(): Promise<VaultSettings> {
  try {
    const settings = await get<VaultSettings>(STORAGE_KEYS.SETTINGS);
    if (!settings) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveVaultSettings(settings: VaultSettings): Promise<void> {
  await set(STORAGE_KEYS.SETTINGS, settings);
}

export async function loadInitialTokens(): Promise<{ tokens: Token[]; requiresUnlock: boolean }> {
  const settings = await loadVaultSettings();

  if (settings.hasPassword) {
    return {
      tokens: [],
      requiresUnlock: true,
    };
  }

  try {
    const tokens = await get<Token[]>(STORAGE_KEYS.UNENCRYPTED_TOKENS);
    if (!tokens || tokens.length === 0) {
      // First time use: initialize sample tokens
      await set(STORAGE_KEYS.UNENCRYPTED_TOKENS, SAMPLE_TOKENS);
      return { tokens: SAMPLE_TOKENS, requiresUnlock: false };
    }
    return { tokens, requiresUnlock: false };
  } catch (err) {
    console.error('Failed to load unencrypted tokens:', err);
    return { tokens: SAMPLE_TOKENS, requiresUnlock: false };
  }
}

export async function saveTokens(tokens: Token[], activeKey: CryptoKey | null): Promise<void> {
  const settings = await loadVaultSettings();

  if (settings.hasPassword && activeKey) {
    const plainText = JSON.stringify(tokens);
    const { cipherText, ivHex } = await encryptData(plainText, activeKey);

    settings.encryptedVaultData = cipherText;
    settings.ivHex = ivHex;
    await saveVaultSettings(settings);
  } else {
    await set(STORAGE_KEYS.UNENCRYPTED_TOKENS, tokens);
  }
}

export async function unlockVaultWithPassword(password: string): Promise<{ success: boolean; tokens: Token[]; activeKey: CryptoKey | null; error?: string }> {
  const settings = await loadVaultSettings();
  if (!settings.hasPassword || !settings.saltHex || !settings.encryptedVaultData) {
    return { success: false, tokens: [], activeKey: null, error: 'Vault is not encrypted.' };
  }

  try {
    const salt = hexToBuffer(settings.saltHex);
    const key = await deriveKey(password, salt);

    // Verify key against hash verifier
    if (settings.verifierHash) {
      const hashCheck = await computeHash(password + settings.saltHex);
      if (hashCheck !== settings.verifierHash) {
        return { success: false, tokens: [], activeKey: null, error: 'Incorrect master password/PIN.' };
      }
    }

    const decryptedJson = await decryptData(settings.encryptedVaultData, settings.ivHex, key);
    const tokens = JSON.parse(decryptedJson) as Token[];

    return {
      success: true,
      tokens,
      activeKey: key,
    };
  } catch (err) {
    console.error('Decryption failed:', err);
    return {
      success: false,
      tokens: [],
      activeKey: null,
      error: 'Decryption failed. Please check your password.',
    };
  }
}

export async function setupVaultPassword(password: string, currentTokens: Token[]): Promise<{ activeKey: CryptoKey }> {
  const salt = generateRandomBytes(16);
  const saltHex = bufferToHex(salt);
  const key = await deriveKey(password, salt);
  const verifierHash = await computeHash(password + saltHex);

  const plainText = JSON.stringify(currentTokens);
  const { cipherText, ivHex } = await encryptData(plainText, key);

  const settings = await loadVaultSettings();
  settings.hasPassword = true;
  settings.saltHex = saltHex;
  settings.ivHex = ivHex;
  settings.encryptedVaultData = cipherText;
  settings.verifierHash = verifierHash;

  await saveVaultSettings(settings);
  // Clear unencrypted storage for security
  await del(STORAGE_KEYS.UNENCRYPTED_TOKENS);

  return { activeKey: key };
}

export async function removeVaultPassword(password: string, currentTokens: Token[]): Promise<boolean> {
  const settings = await loadVaultSettings();
  if (settings.verifierHash && settings.saltHex) {
    const hashCheck = await computeHash(password + settings.saltHex);
    if (hashCheck !== settings.verifierHash) {
      return false;
    }
  }

  settings.hasPassword = false;
  settings.saltHex = '';
  settings.ivHex = '';
  settings.encryptedVaultData = undefined;
  settings.verifierHash = undefined;
  settings.biometricCredentialId = undefined;
  settings.allowBiometrics = false;

  await saveVaultSettings(settings);
  await set(STORAGE_KEYS.UNENCRYPTED_TOKENS, currentTokens);
  return true;
}

export async function resetVaultData(): Promise<void> {
  await del(STORAGE_KEYS.SETTINGS);
  await del(STORAGE_KEYS.UNENCRYPTED_TOKENS);
}
