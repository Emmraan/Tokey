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

export async function loadInitialTokens(): Promise<{ tokens: Token[]; requiresUnlock: boolean }> {
  const settings = await loadVaultSettings();

  if (settings.hasPassword) {
    return {
      tokens: [],
      requiresUnlock: true,
    };
  }

  try {
    const stored = await get<Token[]>(STORAGE_KEYS.UNENCRYPTED_TOKENS);
    // One-time purge of legacy demo/sample tokens
    const tokens = (stored ?? []).filter((t) => !t.id?.startsWith('tokey-sample-'));
    if (stored && tokens.length !== stored.length) {
      await set(STORAGE_KEYS.UNENCRYPTED_TOKENS, tokens);
    }
    return { tokens, requiresUnlock: false };
  } catch (err) {
    console.error('Failed to load unencrypted tokens:', err);
    return { tokens: [], requiresUnlock: false };
  }
}

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
