'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Key,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Token, OtpAlgorithm, OtpType } from '@/lib/types';
import { sanitizeBase32Secret, isValidBase32, generateTotp, generateHotp } from '@/lib/otp';
import { RenderAccountIcon } from '@/lib/brand-icons';
import { useToast } from './NotificationToast';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToken: (token: Token) => void;
  editingToken?: Token | null;
}

const COMMON_ISSUERS = [
  'Google',
  'GitHub',
  'Microsoft',
  'AWS',
  'Discord',
  'Binance',
  'OpenAI',
  'Apple',
  'Coinbase',
  'Cloudflare',
  'Bitwarden',
  'Stripe',
  'Slack',
  'GitLab',
];

export function ManualEntryModal({
  isOpen,
  onClose,
  onSaveToken,
  editingToken,
}: ManualEntryModalProps) {
  const { showToast } = useToast();

  const [issuer, setIssuer] = useState(editingToken?.issuer || '');
  const [account, setAccount] = useState(editingToken?.account || '');
  const [secret, setSecret] = useState(editingToken?.secret || '');
  const [type, setType] = useState<OtpType>(editingToken?.type || 'totp');
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>(editingToken?.algorithm || 'SHA1');
  const [digits, setDigits] = useState<number>(editingToken?.digits || 6);
  const [period, setPeriod] = useState<number>(editingToken?.period || 30);
  const [counter, setCounter] = useState<number>(editingToken?.counter || 0);
  const [category, setCategory] = useState<string>(editingToken?.category || 'Personal');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Clean secret
  const cleanSecret = useMemo(() => sanitizeBase32Secret(secret), [secret]);
  const isSecretValid = useMemo(() => isValidBase32(cleanSecret), [cleanSecret]);

  // Live preview token
  const previewToken: Token = useMemo(() => {
    return {
      id: editingToken?.id || 'preview',
      issuer: issuer.trim() || 'Service Name',
      account: account.trim() || 'username@example.com',
      secret: cleanSecret || 'JBSWY3DPEHPK3PXP',
      type,
      algorithm,
      digits,
      period,
      counter,
      category,
      isPinned: editingToken?.isPinned || false,
      createdAt: editingToken?.createdAt || 0,
      updatedAt: 0,
    };
  }, [editingToken, issuer, account, cleanSecret, type, algorithm, digits, period, counter, category]);

  // Real-time live code calculation
  const liveOtpCode = useMemo(() => {
    if (!cleanSecret) return '------';
    try {
      if (type === 'totp') {
        return generateTotp(previewToken).code;
      } else {
        return generateHotp(previewToken, counter);
      }
    } catch {
      return '------';
    }
  }, [cleanSecret, type, previewToken, counter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!issuer.trim()) {
      showToast({ title: 'Issuer is required', description: 'Please enter a service name.', type: 'error' });
      return;
    }

    if (!cleanSecret || !isSecretValid) {
      showToast({
        title: 'Invalid Secret Key',
        description: 'Please provide a valid Base32 secret key (A-Z, 2-7).',
        type: 'error',
      });
      return;
    }

    const tokenToSave: Token = {
      id: editingToken?.id || `tokey-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      issuer: issuer.trim(),
      account: account.trim() || 'Default Account',
      secret: cleanSecret,
      type,
      algorithm,
      digits,
      period,
      counter: type === 'hotp' ? counter : undefined,
      category,
      isPinned: editingToken?.isPinned || false,
      createdAt: editingToken?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveToken(tokenToSave);
    showToast({
      title: editingToken ? 'Token Updated' : 'Account Saved',
      description: `${tokenToSave.issuer} 2FA configuration saved securely.`,
      type: 'success',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b0e]/85 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-entry-title"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg rounded-xl surface-elevated overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 id="manual-entry-title" className="text-sm font-semibold text-white">
                {editingToken ? 'Edit Account' : 'Add 2FA Account'}
              </h2>
              <p className="text-[11px] text-zinc-400">Zero-knowledge local encryption</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Live Preview Card */}
          <div className="surface-card rounded-lg p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <RenderAccountIcon issuer={issuer} account={account} className="w-8 h-8" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {issuer || 'Service Name'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {account || 'user@example.com'}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono block">
                Live OTP
              </span>
              <span className="mono text-base font-bold text-white tracking-widest">
                {liveOtpCode}
              </span>
            </div>
          </div>

          {/* Issuer Quick Picks */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Service / Issuer <span className="text-zinc-500">*</span>
            </label>
            <input
              type="text"
              required
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. GitHub, Google, AWS"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {/* Quick chips */}
            <div className="flex gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar">
              {COMMON_ISSUERS.slice(0, 6).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setIssuer(item)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 whitespace-nowrap transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Account Label */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Account / Email / Username
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="e.g. alex.design@gmail.com"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Secret Key with Base32 Auto-Cleaner */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-300">
                Secret Key (Base32) <span className="text-zinc-500">*</span>
              </label>
              {secret && (
                <span
                  className={`text-[11px] font-medium ${
                    isSecretValid ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isSecretValid ? 'Valid Key' : 'Invalid Base32'}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value.toUpperCase())}
              placeholder="e.g. JBSWY3DPEHPK3PXP"
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 uppercase tracking-wider"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Spaces and hyphens are automatically stripped.
            </p>
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Type</label>
              <div className="grid grid-cols-2 p-0.5 bg-zinc-900 rounded-lg border border-zinc-700">
                <button
                  type="button"
                  onClick={() => setType('totp')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'totp'
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  TOTP (Time)
                </button>
                <button
                  type="button"
                  onClick={() => setType('hotp')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                    type === 'hotp'
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  HOTP (Counter)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-zinc-500"
              >
                <option value="Personal" className="bg-zinc-900 text-white">Personal</option>
                <option value="Work" className="bg-zinc-900 text-white">Work</option>
                <option value="Finance" className="bg-zinc-900 text-white">Finance</option>
                <option value="Crypto" className="bg-zinc-900 text-white">Crypto</option>
                <option value="Social" className="bg-zinc-900 text-white">Social</option>
                <option value="Developer" className="bg-zinc-900 text-white">Developer</option>
              </select>
            </div>
          </div>

          {/* Advanced Dropdown (Algorithm, Digits, Period) */}
          <div className="surface-card rounded-lg p-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              <span>Advanced Parameters</span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-800">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Algorithm</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as OtpAlgorithm)}
                    className="w-full px-2 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                  >
                    <option value="SHA1" className="bg-zinc-900">SHA-1</option>
                    <option value="SHA256" className="bg-zinc-900">SHA-256</option>
                    <option value="SHA512" className="bg-zinc-900">SHA-512</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Digits</label>
                  <select
                    value={digits}
                    onChange={(e) => setDigits(parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                  >
                    <option value={6} className="bg-zinc-900">6 digits</option>
                    <option value={7} className="bg-zinc-900">7 digits</option>
                    <option value={8} className="bg-zinc-900">8 digits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    {type === 'totp' ? 'Period (sec)' : 'Counter'}
                  </label>
                  {type === 'totp' ? (
                    <select
                      value={period}
                      onChange={(e) => setPeriod(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                    >
                      <option value={15} className="bg-zinc-900">15s</option>
                      <option value={30} className="bg-zinc-900">30s</option>
                      <option value={60} className="bg-zinc-900">60s</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={counter}
                      onChange={(e) => setCounter(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1.5 rounded-md bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isSecretValid || !issuer.trim()}
              className="flex-1 py-2 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              {editingToken ? 'Save Changes' : 'Save Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

