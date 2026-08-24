export type OtpType = 'totp' | 'hotp';
export type OtpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface Token {
  id: string;
  issuer: string;
  account: string;
  secret: string; // Base32
  type: OtpType;
  algorithm: OtpAlgorithm;
  digits: number; // 6, 7, 8
  period: number; // usually 30
  counter?: number; // for HOTP
  category: string; // e.g. 'Personal', 'Work', 'Finance', 'Crypto', 'Social'
  isPinned: boolean;
  color?: string; // hex accent
  icon?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultSettings {
  hasPassword: boolean;
  saltHex: string;
  ivHex: string;
  encryptedVaultData?: string; // encrypted JSON of Token[]
  verifierHash?: string; // SHA-256 of master key for instant unlock check
  autoLockMinutes: number; // 0 = never, 1, 5, 15, 30, 60
  privacyMaskEnabled: boolean;
  compactView: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  allowBiometrics: boolean;
  biometricCredentialId?: string;
  theme: 'dark' | 'midnight' | 'cyber';
  cloudSyncEnabled: boolean;
  lastCloudSync?: number;
}

export interface BackupPayload {
  version: number;
  appName: 'TOKEY';
  exportedAt: string;
  tokens: Token[];
  categories?: string[];
}

export interface EncryptedBackupFile {
  version: number;
  appName: 'TOKEY_ENCRYPTED';
  saltHex: string;
  ivHex: string;
  cipherText: string;
  exportedAt: string;
}

export interface GoogleMigrationAccount {
  secret: string;
  name: string;
  issuer: string;
  algorithm: OtpAlgorithm;
  digits: number;
  type: OtpType;
  counter?: number;
}
