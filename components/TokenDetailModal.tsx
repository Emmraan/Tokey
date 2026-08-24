'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  Trash2,
  Share2,
} from 'lucide-react';
import { Token } from '@/lib/types';
import { buildOtpAuthUri, generateTotp, generateHotp } from '@/lib/otp';
import { RenderAccountIcon } from '@/lib/brand-icons';
import { playCopySound, triggerHaptic } from '@/lib/sound';
import { useToast } from './NotificationToast';

interface TokenDetailModalProps {
  token: Token | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (token: Token) => void;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export function TokenDetailModal({
  token,
  isOpen,
  onClose,
  onDelete,
  soundEnabled,
  hapticEnabled,
}: TokenDetailModalProps) {
  const { showToast } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  const [timestamp, setTimestamp] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen || !token) return null;

  const otpAuthUri = buildOtpAuthUri(token);

  // Time window test calculations (for TOTP diagnostics)
  const currentTimestamp = timestamp || 0;
  const pastCode = token.type === 'totp' && currentTimestamp ? generateTotp(token, currentTimestamp - (token.period || 30) * 1000).code : null;
  const currentCode = token.type === 'totp' ? (currentTimestamp ? generateTotp(token, currentTimestamp).code : '------') : generateHotp(token);
  const futureCode = token.type === 'totp' && currentTimestamp ? generateTotp(token, currentTimestamp + (token.period || 30) * 1000).code : null;

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(token.secret);
      setCopiedSecret(true);
      playCopySound(soundEnabled);
      triggerHaptic(20, hapticEnabled);
      showToast({ title: 'Secret copied', description: 'Base32 secret key copied to clipboard.', type: 'info' });
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyUri = async () => {
    try {
      await navigator.clipboard.writeText(otpAuthUri);
      setCopiedUri(true);
      playCopySound(soundEnabled);
      triggerHaptic(20, hapticEnabled);
      showToast({ title: 'URI copied', description: 'otpauth:// URI copied to clipboard.', type: 'info' });
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090b0e]/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-xl surface-elevated overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <RenderAccountIcon issuer={token.issuer} account={token.account} className="w-8 h-8" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{token.issuer}</h2>
              <p className="text-[11px] text-zinc-400 truncate">{token.account}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* QR Code display */}
          <div className="p-4 rounded-lg bg-white flex flex-col items-center justify-center mx-auto max-w-[200px] shadow-sm">
            <QRCodeSVG
              value={otpAuthUri}
              size={168}
              level="M"
              includeMargin={false}
              className="w-full h-auto"
            />
          </div>
          <p className="text-center text-[11px] text-zinc-500">
            Scan to transfer this security token to another authenticator.
          </p>

          {/* Raw Secret */}
          <div className="surface-card rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Base32 Secret Key</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                </button>
                <button
                  onClick={handleCopySecret}
                  className="text-[11px] text-zinc-200 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors"
                >
                  {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="mono text-xs text-zinc-300 break-all p-2.5 rounded-md bg-zinc-900 border border-zinc-800">
              {showSecret ? token.secret : '••••••••••••••••••••••••••••••••'}
            </div>
          </div>

          {/* Time Window Diagnostics (TOTP) */}
          {token.type === 'totp' && (
            <div className="surface-card rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Clock Window Diagnostics</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">-30s</span>
                  <span className="mono font-semibold text-zinc-400">{pastCode}</span>
                </div>
                <div className="p-2 rounded-md bg-zinc-800 border border-zinc-700">
                  <span className="text-[10px] text-zinc-300 block font-semibold mb-0.5">Current</span>
                  <span className="mono font-bold text-white">{currentCode}</span>
                </div>
                <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block mb-0.5">+30s</span>
                  <span className="mono font-semibold text-zinc-400">{futureCode}</span>
                </div>
              </div>
            </div>
          )}

          {/* Details list */}
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-500">Type</span>
              <span className="mono font-semibold uppercase text-zinc-200">{token.type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-500">Algorithm</span>
              <span className="mono font-semibold text-zinc-200">{token.algorithm || 'SHA1'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-800">
              <span className="text-zinc-500">Digits & Interval</span>
              <span className="mono font-semibold text-zinc-200">
                {token.digits || 6} digits • {token.period || 30}s
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={handleCopyUri}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
            >
              {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedUri ? 'URI Copied' : 'Copy otpauth URI'}</span>
            </button>
            <button
              onClick={() => {
                onDelete(token);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

