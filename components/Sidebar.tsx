'use client';

import React from 'react';
import {
  Shield,
  LayoutGrid,
  KeyRound,
  Eye,
  EyeOff,
  Settings,
  Lock,
  QrCode,
  Plus,
} from 'lucide-react';
import { VaultSettings } from '@/lib/types';

interface SidebarProps {
  settings: VaultSettings;
  selectedCategory: string;
  onCategorySelect: (cat: string) => void;
  onOpenScanModal: () => void;
  onOpenManualModal: () => void;
  onOpenSettingsModal: () => void;
  onLockVault: () => void;
  onTogglePrivacyMask: () => void;
  onToggleCompactView: () => void;
  totalTokensCount: number;
}

export function Sidebar({
  settings,
  selectedCategory,
  onCategorySelect,
  onOpenScanModal,
  onOpenManualModal,
  onOpenSettingsModal,
  onLockVault,
  onTogglePrivacyMask,
}: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-16 border-r border-zinc-800/80 flex-col items-center py-5 gap-6 bg-[var(--bg-rail)] select-none shrink-0 min-h-screen sticky top-0 h-screen z-30">
      {/* Brand Icon Badge */}
      <div className="relative group flex items-center justify-center w-full">
        <button
          type="button"
          onClick={() => onCategorySelect('ALL')}
          aria-label="TOKEY Authenticator — view all accounts"
          className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm cursor-pointer hover:bg-zinc-700 transition-colors"
        >
          <Shield className="w-4 h-4 stroke-[2.2]" />
        </button>
        <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
          TOKEY Authenticator
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col gap-2.5 items-center w-full px-2">
        {/* All Tokens / Vault Grid */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            type="button"
            onClick={() => onCategorySelect('ALL')}
            aria-label="All Accounts"
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'text-white bg-zinc-800 border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
            All Accounts
          </div>
        </div>

        {/* Scan QR Code */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            type="button"
            onClick={onOpenScanModal}
            aria-label="Scan QR Code"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
            Scan QR Code
          </div>
        </div>

        {/* Add Account Manually */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            type="button"
            onClick={onOpenManualModal}
            aria-label="Add Account Manually"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
            Add Account Manually
          </div>
        </div>

        {/* Privacy Mask Toggle */}
        <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={onTogglePrivacyMask}
              aria-label={settings.privacyMaskEnabled ? 'Disable Privacy Blur' : 'Enable Privacy Blur'}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              settings.privacyMaskEnabled
                ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            {settings.privacyMaskEnabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
            {settings.privacyMaskEnabled ? 'Disable Blur' : 'Enable Privacy Blur'}
          </div>
        </div>

        {/* Settings Modal */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            type="button"
            onClick={onOpenSettingsModal}
            aria-label="Settings and Backup"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
            Settings & Backup
          </div>
        </div>
      </nav>

      {/* Bottom Status & Lock */}
      <div className="mt-auto flex flex-col gap-3.5 items-center mb-1">
        {/* Security Indicator */}
        <div className="group relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
            AES-256-GCM
          </div>
        </div>

        {/* Lock Vault Button (if master password exists) */}
        {settings.hasPassword ? (
          <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={onLockVault}
              aria-label="Lock Vault (Cmd+L)"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
            <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
              Lock Vault (Cmd+L)
            </div>
          </div>
        ) : (
          <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={onOpenSettingsModal}
              aria-label="Set Master Password"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <div className="absolute left-14 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 duration-150 z-50 shadow-xl">
              Set Master Password
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

