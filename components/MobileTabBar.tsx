'use client';

import React from 'react';
import { Eye, EyeOff, Plus, QrCode, Settings } from 'lucide-react';

interface MobileTabBarProps {
  privacyMaskEnabled: boolean;
  onOpenScanModal: () => void;
  onOpenManualModal: () => void;
  onTogglePrivacyMask: () => void;
  onOpenSettingsModal: () => void;
}

export function MobileTabBar({
  privacyMaskEnabled,
  onOpenScanModal,
  onOpenManualModal,
  onTogglePrivacyMask,
  onOpenSettingsModal,
}: MobileTabBarProps) {
  const baseBtn =
    'flex flex-col items-center justify-center gap-1 w-full h-full transition-colors cursor-pointer active:bg-zinc-900/60';

  return (
    <nav
      aria-label="Primary actions"
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-zinc-800/80 bg-[#0b0d12]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] select-none"
    >
      <div className="grid grid-cols-4 h-[60px]">
        <button
          type="button"
          onClick={onOpenScanModal}
          aria-label="Scan QR Code"
          className={`${baseBtn} text-zinc-400 hover:text-zinc-200`}
        >
          <QrCode className="w-5 h-5" />
          <span className="text-[10px] font-medium">Scan</span>
        </button>

        <button
          type="button"
          onClick={onOpenManualModal}
          aria-label="Add Account Manually"
          className={`${baseBtn} text-zinc-400 hover:text-zinc-200`}
        >
          <span className="flex items-center justify-center w-8 h-7 rounded-lg bg-white text-zinc-950 shadow-sm">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </span>
          <span className="text-[10px] font-semibold text-zinc-200">Add</span>
        </button>

        <button
          type="button"
          onClick={onTogglePrivacyMask}
          aria-label={privacyMaskEnabled ? 'Disable Privacy Blur' : 'Enable Privacy Blur'}
          aria-pressed={privacyMaskEnabled}
          className={`${baseBtn} ${
            privacyMaskEnabled ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {privacyMaskEnabled ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          <span className="text-[10px] font-medium">Privacy</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettingsModal}
          aria-label="Settings and Backup"
          className={`${baseBtn} text-zinc-400 hover:text-zinc-200`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
}
