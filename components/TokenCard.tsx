'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Star,
  MoreVertical,
  QrCode,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react';
import { Token } from '@/lib/types';
import { generateTotp, generateHotp } from '@/lib/otp';
import { RenderAccountIcon } from '@/lib/brand-icons';
import { playCopySound, triggerHaptic } from '@/lib/sound';
import { useToast } from './NotificationToast';

interface TokenCardProps {
  token: Token;
  privacyMaskEnabled: boolean;
  compactView: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  onPinToggle: (token: Token) => void;
  onEdit: (token: Token) => void;
  onDelete: (token: Token) => void;
  onShowQr: (token: Token) => void;
  onIncrementHotp: (token: Token) => void;
}

export function TokenCard({
  token,
  privacyMaskEnabled,
  compactView,
  soundEnabled,
  hapticEnabled,
  onPinToggle,
  onEdit,
  onDelete,
  onShowQr,
  onIncrementHotp,
}: TokenCardProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Live TOTP state
  const [totpData, setTotpData] = useState(() =>
    token.type === 'totp' ? generateTotp(token) : { code: generateHotp(token), remainingSeconds: 0, period: 30, progress: 1 }
  );

  useEffect(() => {
    if (token.type !== 'totp') return;

    const updateCode = () => {
      setTotpData(generateTotp(token));
    };

    updateCode();
    const interval = setInterval(updateCode, 100);
    return () => clearInterval(interval);
  }, [token]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const codeToCopy = token.type === 'totp' ? totpData.code : generateHotp(token);

    try {
      await navigator.clipboard.writeText(codeToCopy.replace(/\s+/g, ''));
      setCopied(true);
      playCopySound(soundEnabled);
      triggerHaptic([20, 40, 20], hapticEnabled);
      showToast({
        title: 'Copied to clipboard',
        description: `${token.issuer || 'Account'} code ${codeToCopy} copied.`,
        type: 'success',
        duration: 2200,
      });

      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast({
        title: 'Failed to copy',
        description: 'Clipboard permission required.',
        type: 'error',
      });
    }
  };

  // Format code with middle space: "123 456"
  const formattedCode = React.useMemo(() => {
    const raw = token.type === 'totp' ? totpData.code : generateHotp(token);
    if (!raw || raw.includes('-')) return raw;
    const mid = Math.ceil(raw.length / 2);
    return `${raw.slice(0, mid)} ${raw.slice(mid)}`;
  }, [token, totpData.code]);

  const remaining = totpData.remainingSeconds;
  const isUrgent = remaining < 5;
  const isWarning = remaining >= 5 && remaining <= 10;

  const timerColor = isUrgent
    ? 'text-rose-500 stroke-rose-500'
    : isWarning
    ? 'text-amber-400 stroke-amber-400'
    : 'text-emerald-400 stroke-emerald-400';

  const circumference = 87.96; // 2 * PI * 14
  const strokeDashoffset = circumference * (1 - totpData.progress);

  const isMasked = privacyMaskEnabled && !isHovered && !isRevealed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      className={`rounded-2xl relative group flex flex-col justify-between transition-all duration-300 border hover:shadow-lg ${
        token.isPinned 
          ? 'bg-zinc-900/90 border-zinc-700/80 hover:border-zinc-600/90' 
          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/70'
      } ${compactView ? 'p-3.5 gap-2.5' : 'p-4 sm:p-5 gap-4'}`}
    >
      {/* Top Header: Brand, Title, Account, Timer */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <RenderAccountIcon
            issuer={token.issuer}
            account={token.account}
            className="w-9 h-9 rounded-lg"
            iconSize="w-4 h-4"
          />
          <div className="min-w-0 flex-1 mt-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-50 truncate text-sm leading-none tracking-tight">
                {token.issuer || 'Unnamed Account'}
              </h3>
              {token.isPinned && (
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-zinc-500 truncate font-medium mt-1.5" title={token.account}>
              {token.account || 'No account identifier'}
            </p>
          </div>
        </div>

        {/* Right side: Countdown Gauge or HOTP Increment */}
        {token.type === 'totp' ? (
          <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
            <svg className="w-9 h-9 -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
              <circle
                className="text-zinc-800/80"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
                r="14"
                cx="18"
                cy="18"
              />
              <circle
                className={`${timerColor} transition-all duration-100 ease-linear`}
                strokeWidth="3"
                strokeDasharray="87.96"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                r="14"
                cx="18"
                cy="18"
              />
            </svg>
            <span
              className={`absolute text-[10px] font-mono font-semibold tracking-tighter ${
                isUrgent ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400' : 'text-zinc-400'
              }`}
            >
              {remaining}s
            </span>
          </div>
        ) : (
          <button
            id={`hotp-increment-${token.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onIncrementHotp(token);
            }}
            title="Generate next HOTP code"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 hover:border-zinc-600 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Middle Code Box with Direct Click-to-Copy */}
      <div
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        title="Click to copy security code"
        className="flex items-center justify-between bg-zinc-950 hover:bg-black border border-zinc-900/80 hover:border-zinc-800 rounded-xl px-4 py-3 mt-0.5 cursor-pointer transition-all duration-200 group/box select-none overflow-hidden relative shadow-inner"
      >
        <span
          className={`font-mono font-bold tracking-[0.2em] transition-all duration-200 tabular-nums ${
            compactView ? 'text-xl' : 'text-3xl'
          } ${isUrgent ? 'text-rose-400' : 'text-zinc-100'} ${
            isMasked ? 'blur-sm select-none opacity-20' : 'opacity-100 group-hover/box:text-white'
          }`}
        >
          {formattedCode}
        </span>

        <button
          onClick={handleCopy}
          className={`relative z-10 p-2 rounded-md transition-all duration-200 cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 scale-110'
              : 'text-zinc-500 group-hover/box:text-zinc-300 hover:bg-zinc-800/80 active:scale-95'
          }`}
        >
          {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Metadata & Options Bar */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          {token.category && (
            <span className="font-medium px-2 py-0.5 rounded-full bg-zinc-950/50 text-zinc-400 border border-zinc-800/80">
              {token.category}
            </span>
          )}
          <span className="font-mono tracking-wide">
            {token.algorithm || 'SHA1'}
          </span>
          {token.digits && token.digits !== 6 && (
            <span className="font-mono tracking-wide">
              &bull; {token.digits}D
            </span>
          )}
        </div>

        {/* Options Row */}
        <div className="relative flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinToggle(token);
            }}
            title={token.isPinned ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-1 rounded transition-colors ${
              token.isPinned
                ? 'text-amber-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${token.isPinned ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            title="More Options"
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Clean Menu Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 bottom-7 z-30 w-40 rounded-lg surface-elevated py-1 text-xs text-zinc-200 shadow-xl"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onShowQr(token);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors text-zinc-200"
                >
                  <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Show QR & Info</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit(token);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors text-zinc-200"
                >
                  <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Edit Token</span>
                </button>
                {privacyMaskEnabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRevealed(!isRevealed);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors text-zinc-200"
                  >
                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isRevealed ? 'Hide Code' : 'Reveal Code'}</span>
                  </button>
                )}
                <div className="my-1 border-t border-zinc-700/60" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(token);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

