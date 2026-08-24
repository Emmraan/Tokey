'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Fingerprint,
  AlertCircle,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authenticatePasskey } from '@/lib/webauthn';
import { playUnlockSound } from '@/lib/sound';
import { useToast } from './NotificationToast';

interface VaultLockScreenProps {
  onUnlockWithPassword: (password: string) => Promise<boolean>;
  allowBiometrics: boolean;
  biometricCredentialId?: string;
  onEmergencyReset: () => Promise<void>;
  soundEnabled: boolean;
}

export function VaultLockScreen({
  onUnlockWithPassword,
  allowBiometrics,
  biometricCredentialId,
  onEmergencyReset,
  soundEnabled,
}: VaultLockScreenProps) {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError(null);
    setIsDecrypting(true);

    try {
      const success = await onUnlockWithPassword(password);
      if (success) {
        playUnlockSound(soundEnabled);
        showToast({
          title: 'Vault Unlocked',
          description: 'Zero-knowledge credentials decrypted successfully.',
          type: 'shield',
        });
      } else {
        setError('Incorrect Master Password or PIN.');
      }
    } catch (err: any) {
      setError(err.message || 'Decryption error.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError(null);
    setIsDecrypting(true);
    try {
      const success = await authenticatePasskey(biometricCredentialId);
      if (success) {
        showToast({
          title: 'Passkey Verified',
          description: 'Biometric authentication successful.',
          type: 'shield',
        });
      } else {
        setError('Biometric authentication cancelled or not recognized.');
      }
    } catch {
      setError('Biometric check failed.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b0e]/95 backdrop-blur-md">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-lock-title"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="surface-elevated rounded-2xl relative w-full max-w-sm p-6 sm:p-8 text-center"
      >
        {/* Brand Shield Icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
          <Shield className="w-5 h-5 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h2 id="vault-lock-title" className="text-lg font-bold text-white tracking-tight">Unlock Vault</h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Enter master password or PIN to decrypt your TOTP keys.
        </p>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Master Password / PIN"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center mono text-sm tracking-widest text-white placeholder:tracking-normal placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isDecrypting || !password}
            className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span>{isDecrypting ? 'Decrypting...' : 'Unlock Vault'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          {/* Biometric Button */}
          {allowBiometrics && (
            <button
              type="button"
              onClick={handleBiometricUnlock}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/80 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-zinc-400" />
              <span>Unlock with Passkey / Biometrics</span>
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>AES-256-GCM</span>
          </div>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Wipe entire vault and reset all stored keys?')) {
                  await onEmergencyReset();
                }
              }}
              className="text-rose-400 hover:underline font-semibold cursor-pointer"
            >
              Confirm Wipe
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

