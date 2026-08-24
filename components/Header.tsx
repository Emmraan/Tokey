'use client';

import React from 'react';
import {
  Shield,
  Search,
  Plus,
  QrCode,
  Lock,
  Settings,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Star,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { VaultSettings } from '@/lib/types';

interface HeaderProps {
  settings: VaultSettings;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  categories: string[];
  totalTokensCount: number;
  pinnedTokensCount: number;
  onOpenScanModal: () => void;
  onOpenManualModal: () => void;
  onOpenSettingsModal: () => void;
  onLockVault: () => void;
  onTogglePrivacyMask: () => void;
  onToggleCompactView: () => void;
}

export function Header({
  settings,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categories,
  totalTokensCount,
  pinnedTokensCount,
  onOpenScanModal,
  onOpenManualModal,
  onOpenSettingsModal,
  onLockVault,
  onTogglePrivacyMask,
  onToggleCompactView,
}: HeaderProps) {
  return (
    <header className="z-20 bg-[#090b0e]/95 backdrop-blur-md pt-4 sm:pt-6 pb-3 border-b border-zinc-800/80 px-4 sm:px-8 lg:px-10 transition-all select-none flex-shrink-0">
      {/* Primary Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Left Title & Security Badge */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800/90 flex items-center justify-center text-zinc-100 shadow-sm shrink-0">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>TOKEY Vault</span>
              </h1>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                {totalTokensCount} {totalTokensCount === 1 ? 'account' : 'accounts'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Client-side encrypted with zero-knowledge AES-256-GCM
            </p>
          </div>
        </div>

        {/* Right Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex items-center w-full sm:w-60 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-zinc-700 transition-all shadow-inner">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0 mr-2" />
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search accounts..."
              aria-label="Search accounts"
              className="bg-transparent border-none text-xs focus:outline-none w-full text-zinc-100 placeholder:text-zinc-600"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block text-[9px] font-mono text-zinc-500 px-1 rounded bg-zinc-900 border border-zinc-800/80">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Quick Utility Icon Actions */}
          <div className="flex items-center gap-1 bg-zinc-950/40 p-1 rounded-lg border border-zinc-900">
            <button
              id="btn-toggle-privacy"
              type="button"
              onClick={onTogglePrivacyMask}
              aria-label={settings.privacyMaskEnabled ? 'Disable Privacy Blur' : 'Enable Privacy Mask (Anti-Shoulder Surfing)'}
              title={settings.privacyMaskEnabled ? 'Disable Privacy Blur' : 'Enable Privacy Mask (Anti-Shoulder Surfing)'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                settings.privacyMaskEnabled
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {settings.privacyMaskEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <button
              id="btn-toggle-compact"
              type="button"
              onClick={onToggleCompactView}
              aria-label={settings.compactView ? 'Switch to Standard Grid' : 'Switch to Compact Grid'}
              title={settings.compactView ? 'Switch to Standard Grid' : 'Switch to Compact Grid'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                settings.compactView
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {settings.compactView ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            </button>

            {settings.hasPassword && (
              <button
                id="btn-lock-vault"
                type="button"
                onClick={onLockVault}
                aria-label="Lock Vault (Cmd+L)"
                title="Lock Vault (Cmd+L)"
                className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="btn-open-settings"
              type="button"
              onClick={onOpenSettingsModal}
              aria-label="Settings and Backup"
              title="Settings & Backup"
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action CTAs */}
          <button
            id="btn-scan-qr"
            type="button"
            onClick={onOpenScanModal}
            aria-label="Scan QR Code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>Scan QR</span>
          </button>

          <button
            id="btn-add-manual"
            type="button"
            onClick={onOpenManualModal}
            aria-label="Add Account Manually"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Category Segmented Rail */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1.5 no-scrollbar">
        <button
          onClick={() => onCategorySelect('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
            selectedCategory === 'ALL'
              ? 'bg-white text-zinc-950 font-semibold border-white shadow-sm'
              : 'bg-zinc-900/45 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border-zinc-800/80'
          }`}
        >
          All Accounts ({totalTokensCount})
        </button>

        {pinnedTokensCount > 0 && (
          <button
            onClick={() => onCategorySelect('PINNED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === 'PINNED'
                ? 'bg-amber-400 text-zinc-950 font-semibold border-amber-400 shadow-sm'
                : 'bg-zinc-900/45 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border-zinc-800/80'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${selectedCategory === 'PINNED' ? 'fill-zinc-950 text-zinc-950' : 'fill-amber-400 text-amber-400'}`} />
            <span>Favorites ({pinnedTokensCount})</span>
          </button>
        )}

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategorySelect(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-white text-zinc-950 font-semibold border-white shadow-sm'
                : 'bg-zinc-900/45 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border-zinc-800/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
}

