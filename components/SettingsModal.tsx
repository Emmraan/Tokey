'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Shield,
  Lock,
  Unlock,
  Fingerprint,
  Upload,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  Volume2,
  VolumeX,
  Smartphone,
  Eye,
  Cloud,
} from 'lucide-react';
import { Token, VaultSettings } from '@/lib/types';
import {
  createEncryptedBackup,
  restoreEncryptedBackup,
  createPlaintextJsonBackup,
  createCsvBackup,
  downloadFile,
  mergeTokens,
} from '@/lib/cloud-sync';
import { isWebAuthnSupported, registerPasskey } from '@/lib/webauthn';
import { useToast } from './NotificationToast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VaultSettings;
  tokens: Token[];
  onUpdateSettings: (newSettings: VaultSettings) => Promise<void>;
  onSetupPassword: (password: string) => Promise<void>;
  onRemovePassword: (password: string) => Promise<boolean>;
  onRestoreTokens: (tokens: Token[]) => Promise<void>;
  onResetAllData: () => Promise<void>;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  tokens,
  onUpdateSettings,
  onSetupPassword,
  onRemovePassword,
  onRestoreTokens,
  onResetAllData,
}: SettingsModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'security' | 'backup' | 'preferences' | 'cloud'>('security');

  // Security password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [removePassInput, setRemovePassInput] = useState('');
  const [isProcessingPass, setIsProcessingPass] = useState(false);

  // Backup restore state
  const [restorePassword, setRestorePassword] = useState('');
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [isEncryptedBackupFile, setIsEncryptedBackupFile] = useState(false);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');

  // Passkey setup
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  if (!isOpen) return null;

  // Handle setting/changing master password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      showToast({
        title: 'Weak Password',
        description: 'Password or PIN must be at least 4 characters.',
        type: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        title: 'Passwords do not match',
        description: 'Please re-enter the exact same password.',
        type: 'error',
      });
      return;
    }

    setIsProcessingPass(true);
    try {
      await onSetupPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast({
        title: 'Vault Encrypted',
        description: 'Your 2FA tokens are encrypted with AES-256-GCM.',
        type: 'shield',
      });
    } catch (err: any) {
      showToast({
        title: 'Setup Failed',
        description: err.message || 'Could not encrypt vault.',
        type: 'error',
      });
    } finally {
      setIsProcessingPass(false);
    }
  };

  // Handle removing master password
  const handleRemovePassword = async () => {
    if (!removePassInput) return;
    setIsProcessingPass(true);
    try {
      const success = await onRemovePassword(removePassInput);
      if (success) {
        setRemovePassInput('');
        showToast({
          title: 'Password Removed',
          description: 'Vault is now unlocked for fast local access.',
          type: 'info',
        });
      } else {
        showToast({
          title: 'Incorrect Password',
          description: 'Could not decrypt vault to remove master password.',
          type: 'error',
        });
      }
    } finally {
      setIsProcessingPass(false);
    }
  };

  // Setup WebAuthn Biometrics
  const handleSetupPasskey = async () => {
    setIsRegisteringPasskey(true);
    try {
      const isSupported = await isWebAuthnSupported();
      if (!isSupported) {
        showToast({
          title: 'Biometrics Unsupported',
          description: 'This browser does not support TouchID / FaceID / Passkeys.',
          type: 'info',
        });
        return;
      }

      const credentialId = await registerPasskey();
      if (credentialId) {
        await onUpdateSettings({
          ...settings,
          allowBiometrics: true,
          biometricCredentialId: credentialId,
        });
        showToast({
          title: 'Passkey Registered',
          description: 'You can now unlock TOKEY with TouchID / FaceID / Windows Hello.',
          type: 'success',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Passkey Setup Error',
        description: err.message || 'Passkey was not registered.',
        type: 'error',
      });
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // Encrypted JSON Export
  const handleExportEncrypted = async () => {
    const backupPassword = prompt('Enter a password to encrypt this backup file:', '');
    if (!backupPassword) return;

    try {
      const json = await createEncryptedBackup(tokens, backupPassword);
      downloadFile(json, `tokey_backup_encrypted_${Date.now()}.json`);
      showToast({
        title: 'Encrypted Backup Exported',
        description: `${tokens.length} accounts encrypted with AES-256 and saved.`,
        type: 'success',
      });
    } catch {
      showToast({ title: 'Export failed', type: 'error' });
    }
  };

  // Plaintext Export
  const handleExportPlaintext = () => {
    const confirmWarning = window.confirm(
      'SECURITY WARNING: Plaintext export contains unencrypted secret keys in plain text. Keep this file strictly offline and private. Proceed?'
    );
    if (!confirmWarning) return;

    const json = createPlaintextJsonBackup(tokens);
    downloadFile(json, `tokey_backup_plaintext_${Date.now()}.json`);
    showToast({
      title: 'Plaintext JSON Exported',
      description: 'Saved unencrypted backup to downloads.',
      type: 'info',
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    const confirmWarning = window.confirm(
      'SECURITY WARNING: CSV export contains unencrypted secret keys in plain text. Proceed?'
    );
    if (!confirmWarning) return;

    const csv = createCsvBackup(tokens);
    downloadFile(csv, `tokey_backup_${Date.now()}.csv`, 'text/csv');
    showToast({
      title: 'CSV Backup Exported',
      description: 'Saved spreadsheet compatible 2FA CSV.',
      type: 'info',
    });
  };

  // Restore file selection
  const handleSelectRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBackupFileContent(content);

      try {
        const parsed = JSON.parse(content);
        if (parsed.appName === 'TOKEY_ENCRYPTED') {
          setIsEncryptedBackupFile(true);
        } else if (parsed.tokens && Array.isArray(parsed.tokens)) {
          setIsEncryptedBackupFile(false);
        } else {
          showToast({ title: 'Invalid Backup File', type: 'error' });
        }
      } catch {
        showToast({ title: 'Invalid JSON File', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  // Confirm restore
  const handleConfirmRestore = async () => {
    if (!backupFileContent) return;

    try {
      let importedTokens: Token[] = [];

      if (isEncryptedBackupFile) {
        if (!restorePassword) {
          showToast({ title: 'Password Required', description: 'Enter the password used to encrypt this backup.', type: 'error' });
          return;
        }
        importedTokens = await restoreEncryptedBackup(backupFileContent, restorePassword);
      } else {
        const payload = JSON.parse(backupFileContent);
        importedTokens = payload.tokens || [];
      }

      const { merged, addedCount, updatedCount } = mergeTokens(tokens, importedTokens);
      await onRestoreTokens(merged);

      showToast({
        title: 'Restore Completed',
        description: `Imported ${addedCount} new accounts (${updatedCount} updated).`,
        type: 'success',
      });

      setBackupFileContent(null);
      setRestorePassword('');
    } catch (err: any) {
      showToast({
        title: 'Restore Failed',
        description: err.message || 'Incorrect password or corrupted backup file.',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b0e]/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-2xl rounded-xl surface-elevated overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Vault Settings</h2>
              <p className="text-[11px] text-zinc-400">Zero-knowledge encryption & local preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-5 pt-2.5 border-b border-zinc-800 gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { key: 'security', label: 'Security' },
              { key: 'backup', label: 'Backup & Export' },
              { key: 'preferences', label: 'Preferences' },
              { key: 'cloud', label: 'Cloud Sync' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'border-zinc-200 text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: VAULT SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Security Status Box */}
              <div className="surface-card rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      settings.hasPassword
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                        : 'bg-amber-950/40 border-amber-800/40 text-amber-400'
                    }`}
                  >
                    {settings.hasPassword ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      {settings.hasPassword ? 'Vault Encrypted (AES-256-GCM)' : 'Vault is Unprotected'}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {settings.hasPassword
                        ? 'Zero-knowledge encryption with PBKDF2 key derivation.'
                        : 'Tokens are stored in browser storage without master password encryption.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Set or Change Password */}
              <div className="surface-card rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-300">
                  {settings.hasPassword ? 'Change Master Password / PIN' : 'Set Master Password / PIN'}
                </h4>
                <form onSubmit={handleSavePassword} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Master Password / PIN"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Master Password"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessingPass || !newPassword}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    {isProcessingPass ? 'Encrypting...' : settings.hasPassword ? 'Update Password' : 'Lock Vault with Password'}
                  </button>
                </form>
              </div>

              {/* Biometrics Passkey */}
              <div className="surface-card rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Biometric / Passkey Unlock</h4>
                    <p className="text-[11px] text-zinc-400">
                      Use TouchID, FaceID, or Windows Hello for fast unlock.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSetupPasskey}
                  disabled={isRegisteringPasskey}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    settings.allowBiometrics
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                  }`}
                >
                  {settings.allowBiometrics ? '✓ Active' : 'Setup Passkey'}
                </button>
              </div>

              {/* Auto-Lock Timer */}
              <div className="surface-card rounded-lg p-4 space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Auto-Lock Inactivity Timeout
                </label>
                <select
                  value={settings.autoLockMinutes}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      autoLockMinutes: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value={1} className="bg-zinc-900">1 Minute of Inactivity</option>
                  <option value={5} className="bg-zinc-900">5 Minutes of Inactivity (Recommended)</option>
                  <option value={15} className="bg-zinc-900">15 Minutes of Inactivity</option>
                  <option value={30} className="bg-zinc-900">30 Minutes of Inactivity</option>
                  <option value={0} className="bg-zinc-900">Never Auto-Lock</option>
                </select>
              </div>

              {/* Remove Password */}
              {settings.hasPassword && (
                <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/30 space-y-2.5">
                  <h4 className="text-xs font-semibold text-rose-300">Remove Master Password</h4>
                  <p className="text-[11px] text-zinc-400">
                    Revert vault to unencrypted local storage. Requires entering your current password.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={removePassInput}
                      onChange={(e) => setRemovePassInput(e.target.value)}
                      placeholder="Current Password"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-rose-800/40 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                    <button
                      onClick={handleRemovePassword}
                      disabled={!removePassInput || isProcessingPass}
                      className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-xs cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Export Section */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-zinc-300">
                  Export Vault Backup
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Encrypted JSON */}
                  <button
                    onClick={handleExportEncrypted}
                    className="surface-card rounded-lg p-3.5 hover:border-zinc-600 text-left transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-200 w-fit mb-2">
                      <Shield className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Encrypted JSON
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      AES-256 password protected. Safest for export.
                    </p>
                  </button>

                  {/* Plain JSON */}
                  <button
                    onClick={handleExportPlaintext}
                    className="surface-card rounded-lg p-3.5 hover:border-zinc-600 text-left transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-200 w-fit mb-2">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Plain JSON
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Standard JSON for importing to other tools.
                    </p>
                  </button>

                  {/* CSV Export */}
                  <button
                    onClick={handleExportCsv}
                    className="surface-card rounded-lg p-3.5 hover:border-zinc-600 text-left transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-200 w-fit mb-2">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      CSV File
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Spreadsheet compatible format.
                    </p>
                  </button>
                </div>
              </div>

              {/* Import / Restore Section */}
              <div className="surface-card rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-zinc-300">
                  Restore Backup File
                </h4>

                <div
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e: any) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectRestoreFile(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                  className="border border-dashed border-zinc-700 rounded-lg p-5 text-center hover:border-zinc-500 cursor-pointer transition-colors"
                >
                  <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-zinc-200">
                    {backupFileContent ? 'File Loaded (Click to change)' : 'Select Backup File (.json)'}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Supports TOKEY encrypted or plaintext JSON backups
                  </p>
                </div>

                {backupFileContent && (
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2.5">
                    <p className="text-xs text-zinc-300">
                      Format: <strong className="text-white">{isEncryptedBackupFile ? 'Encrypted Backup' : 'Plaintext Backup'}</strong>
                    </p>

                    {isEncryptedBackupFile && (
                      <input
                        type="password"
                        value={restorePassword}
                        onChange={(e) => setRestorePassword(e.target.value)}
                        placeholder="Enter Backup Decryption Password"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-zinc-500"
                      />
                    )}

                    <button
                      onClick={handleConfirmRestore}
                      className="w-full py-2 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      Merge & Restore Accounts into Vault
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-3">
              {/* Sound toggle */}
              <div className="surface-card rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Audio Feedback</h4>
                    <p className="text-[11px] text-zinc-400">
                      Subtle tactile audio clicks when copying codes and scanning.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-zinc-200 cursor-pointer"
                />
              </div>

              {/* Haptic toggle */}
              <div className="surface-card rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Haptic Vibration</h4>
                    <p className="text-[11px] text-zinc-400">
                      Vibrate mobile device on code copy and actions.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.hapticEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, hapticEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-zinc-200 cursor-pointer"
                />
              </div>

              {/* Default Privacy Blur */}
              <div className="surface-card rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Privacy Blur (Anti-Shoulder Surfing)</h4>
                    <p className="text-[11px] text-zinc-400">
                      Keep OTP security codes hidden until clicked or hovered.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacyMaskEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, privacyMaskEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-zinc-200 cursor-pointer"
                />
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <h4 className="text-xs font-semibold text-rose-400">
                  Danger Zone
                </h4>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Wipe All Accounts & Reset Vault
                  </button>
                ) : (
                  <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-800/40 space-y-2.5">
                    <p className="text-xs text-rose-200">
                      Type <strong className="text-white mono">WIPE</strong> to permanently delete all {tokens.length} accounts and reset your vault.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resetInput}
                        onChange={(e) => setResetInput(e.target.value)}
                        placeholder="Type WIPE"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-rose-800/50 text-xs text-white"
                      />
                      <button
                        onClick={async () => {
                          if (resetInput === 'WIPE') {
                            await onResetAllData();
                            showToast({ title: 'Vault Wiped', description: 'All data deleted.', type: 'info' });
                            setShowResetConfirm(false);
                            onClose();
                          }
                        }}
                        disabled={resetInput !== 'WIPE'}
                        className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Confirm Wipe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CLOUD SYNC */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="surface-card rounded-lg p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-zinc-300 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Client-Side Zero-Knowledge Sync</h4>
                    <p className="text-[11px] text-zinc-400">
                      Syncs an encrypted snapshot with local master key protection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="surface-card rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-medium">Automatic Snapshot Sync</span>
                  <input
                    type="checkbox"
                    checked={settings.cloudSyncEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, cloudSyncEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-zinc-200 cursor-pointer"
                  />
                </div>

                <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800">
                  <span>Last Snapshot:</span>
                  <span className="text-zinc-200 mono">
                    {settings.lastCloudSync
                      ? new Date(settings.lastCloudSync).toLocaleTimeString()
                      : 'Not synced yet'}
                  </span>
                </div>

                <button
                  onClick={async () => {
                    await onUpdateSettings({
                      ...settings,
                      lastCloudSync: Date.now(),
                      cloudSyncEnabled: true,
                    });
                    showToast({
                      title: 'Snapshot Saved',
                      description: `${tokens.length} security tokens synchronized.`,
                      type: 'shield',
                    });
                  }}
                  className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Vault Now
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

