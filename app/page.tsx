'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MotionConfig } from 'motion/react';
import { Token, VaultSettings } from '@/lib/types';
import {
  loadVaultSettings,
  saveVaultSettings,
  loadInitialTokens,
  saveTokens,
  unlockVaultWithPassword,
  setupVaultPassword,
  removeVaultPassword,
  resetVaultData,
} from '@/lib/storage';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { TokenGrid } from '@/components/TokenGrid';
import { MobileTabBar } from '@/components/MobileTabBar';
import { QrScannerModal } from '@/components/QrScannerModal';
import { ManualEntryModal } from '@/components/ManualEntryModal';
import { TokenDetailModal } from '@/components/TokenDetailModal';
import { SettingsModal } from '@/components/SettingsModal';
import { VaultLockScreen } from '@/components/VaultLockScreen';
import { ToastProvider, useToast } from '@/components/NotificationToast';
import { playLockSound } from '@/lib/sound';

function AuthenticatorApp() {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [settings, setSettings] = useState<VaultSettings>({
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
  });

  const [isLocked, setIsLocked] = useState(false);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeDetailToken, setActiveDetailToken] = useState<Token | null>(null);
  const [editingToken, setEditingToken] = useState<Token | null>(null);

  // Inactivity auto-lock timer
  const lastActivityRef = useRef<number>(0);

  // Initialize vault on startup
  useEffect(() => {
    lastActivityRef.current = Date.now();
    async function init() {
      try {
        const loadedSettings = await loadVaultSettings();
        setSettings(loadedSettings);

        const { tokens: initialTokens, requiresUnlock } = await loadInitialTokens();
        if (requiresUnlock) {
          setIsLocked(true);
        } else {
          setTokens(initialTokens);
          setIsLocked(false);
        }
      } catch (err) {
        console.error('Failed to init vault:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Lock Vault
  const handleLockVault = useCallback(() => {
    if (!settings.hasPassword) return;
    setActiveKey(null);
    setTokens([]);
    setIsLocked(true);
    playLockSound(settings.soundEnabled);
  }, [settings.hasPassword, settings.soundEnabled]);

  // Inactivity auto-lock listener
  useEffect(() => {
    if (!settings.hasPassword || isLocked || settings.autoLockMinutes === 0) return;

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - lastActivityRef.current) / 60000;
      if (elapsedMinutes >= settings.autoLockMinutes) {
        handleLockVault();
        showToast({
          title: 'Vault Auto-Locked',
          description: `Locked after ${settings.autoLockMinutes} minutes of inactivity.`,
          type: 'shield',
        });
      }
    }, 15000);

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [settings.hasPassword, isLocked, settings.autoLockMinutes, handleLockVault, showToast]);

  // Global keyboard shortcuts (Ctrl/Cmd+K, Ctrl/Cmd+N, Ctrl/Cmd+L, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('header-search-input');
        if (searchInput) searchInput.focus();
      } else if (isMeta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingToken(null);
        setManualModalOpen(true);
      } else if (isMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setScanModalOpen(true);
      } else if (isMeta && e.key.toLowerCase() === 'l' && settings.hasPassword && !isLocked) {
        e.preventDefault();
        handleLockVault();
      } else if (e.key === 'Escape') {
        setScanModalOpen(false);
        setManualModalOpen(false);
        setSettingsModalOpen(false);
        setDetailModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.hasPassword, isLocked, handleLockVault]);

  // Persist tokens
  const persistTokens = useCallback(
    async (newTokens: Token[]) => {
      setTokens(newTokens);
      await saveTokens(newTokens, activeKey);
    },
    [activeKey]
  );

  // Update Settings
  const handleUpdateSettings = async (newSettings: VaultSettings) => {
    setSettings(newSettings);
    await saveVaultSettings(newSettings);
  };

  // Unlock Vault with Master Password
  const handleUnlockWithPassword = async (password: string): Promise<boolean> => {
    const result = await unlockVaultWithPassword(password);
    if (result.success) {
      setTokens(result.tokens);
      setActiveKey(result.activeKey);
      setIsLocked(false);
      lastActivityRef.current = Date.now();
      return true;
    }
    return false;
  };

  // Setup Master Password
  const handleSetupPassword = async (password: string) => {
    const { activeKey: derivedKey } = await setupVaultPassword(password, tokens);
    setActiveKey(derivedKey);
    const updatedSettings = await loadVaultSettings();
    setSettings(updatedSettings);
  };

  // Remove Master Password
  const handleRemovePassword = async (password: string): Promise<boolean> => {
    const success = await removeVaultPassword(password, tokens);
    if (success) {
      setActiveKey(null);
      const updatedSettings = await loadVaultSettings();
      setSettings(updatedSettings);
      return true;
    }
    return false;
  };

  // Reset Vault All Data
  const handleResetAllData = async () => {
    await resetVaultData();
    setTokens([]);
    setActiveKey(null);
    setIsLocked(false);
    const defaultSettings = await loadVaultSettings();
    setSettings(defaultSettings);
  };

  // Pin / Unpin Token
  const handlePinToggle = async (token: Token) => {
    const updated = tokens.map((t) => (t.id === token.id ? { ...t, isPinned: !t.isPinned } : t));
    await persistTokens(updated);
  };

  // Save or Update Token
  const handleSaveToken = async (token: Token) => {
    const index = tokens.findIndex((t) => t.id === token.id);
    let updated: Token[];
    if (index >= 0) {
      updated = [...tokens];
      updated[index] = token;
    } else {
      updated = [token, ...tokens];
    }
    await persistTokens(updated);
  };

  // Batch import (e.g. from Google Authenticator)
  const handleBatchImport = async (incoming: Token[]) => {
    const updated = [...incoming, ...tokens];
    await persistTokens(updated);
  };

  // Delete Token
  const handleDeleteToken = async (token: Token) => {
    const updated = tokens.filter((t) => t.id !== token.id);
    await persistTokens(updated);
    showToast({
      title: 'Token Deleted',
      description: `${token.issuer} was removed from your vault.`,
      type: 'info',
    });
  };

  // Increment HOTP counter
  const handleIncrementHotp = async (token: Token) => {
    const newCounter = (token.counter || 0) + 1;
    const updated = tokens.map((t) =>
      t.id === token.id ? { ...t, counter: newCounter, updatedAt: Date.now() } : t
    );
    await persistTokens(updated);
    showToast({
      title: 'HOTP Counter Incremented',
      description: `Generated code for counter #${newCounter}.`,
      type: 'success',
      duration: 1500,
    });
  };

  // Categories list
  const categories = React.useMemo(() => {
    const defaults = ['Personal', 'Work', 'Finance', 'Crypto', 'Social', 'Developer'];
    const custom = tokens.map((t) => t.category).filter(Boolean);
    return Array.from(new Set([...defaults, ...custom])).filter((c) => c !== 'General');
  }, [tokens]);

  const pinnedTokensCount = React.useMemo(() => tokens.filter((t) => t.isPinned).length, [tokens]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-500 border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-[11px] mono text-zinc-400 tracking-wider">LOADING VAULT...</p>
        </div>
      </div>
    );
  }

  // If Vault is Locked with Master Password
  if (isLocked) {
    return (
      <VaultLockScreen
        onUnlockWithPassword={handleUnlockWithPassword}
        allowBiometrics={settings.allowBiometrics}
        biometricCredentialId={settings.biometricCredentialId}
        onEmergencyReset={handleResetAllData}
        soundEnabled={settings.soundEnabled}
      />
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-[var(--bg-app)] text-zinc-100 flex selection:bg-zinc-700 selection:text-white">
      {/* Left Sidebar Rail (Desktop) */}
      <Sidebar
        settings={settings}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onOpenScanModal={() => setScanModalOpen(true)}
        onOpenManualModal={() => {
          setEditingToken(null);
          setManualModalOpen(true);
        }}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onLockVault={handleLockVault}
        onTogglePrivacyMask={() =>
          handleUpdateSettings({
            ...settings,
            privacyMaskEnabled: !settings.privacyMaskEnabled,
          })
        }
        onToggleCompactView={() =>
          handleUpdateSettings({
            ...settings,
            compactView: !settings.compactView,
          })
        }
        totalTokensCount={tokens.length}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 relative h-dvh">
        {/* Top Header */}
        <Header
          settings={settings}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          categories={categories}
          totalTokensCount={tokens.length}
          pinnedTokensCount={pinnedTokensCount}
          onOpenScanModal={() => setScanModalOpen(true)}
          onOpenManualModal={() => {
            setEditingToken(null);
            setManualModalOpen(true);
          }}
          onOpenSettingsModal={() => setSettingsModalOpen(true)}
          onLockVault={handleLockVault}
          onTogglePrivacyMask={() =>
            handleUpdateSettings({
              ...settings,
              privacyMaskEnabled: !settings.privacyMaskEnabled,
            })
          }
          onToggleCompactView={() =>
            handleUpdateSettings({
              ...settings,
              compactView: !settings.compactView,
            })
          }
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-10 pb-28 lg:pb-6 pt-4">
          {/* Token Grid */}
          <div className="flex-1">
            <TokenGrid
              tokens={tokens}
            settings={settings}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onPinToggle={handlePinToggle}
            onEdit={(t) => {
              setEditingToken(t);
              setManualModalOpen(true);
            }}
            onDelete={handleDeleteToken}
            onShowQr={(t) => {
              setActiveDetailToken(t);
              setDetailModalOpen(true);
            }}
            onIncrementHotp={handleIncrementHotp}
            onOpenScanModal={() => setScanModalOpen(true)}
            onOpenManualModal={() => {
              setEditingToken(null);
              setManualModalOpen(true);
            }}
            onOpenSettingsModal={() => setSettingsModalOpen(true)}
          />
        </div>

        {/* Status Bar (desktop only — mobile uses the bottom tab bar zone) */}
        <footer className="hidden lg:flex mt-auto items-center justify-between border-t border-zinc-800/80 pt-4 pb-1 text-[11px] text-zinc-500 font-medium gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-center sm:text-left">
            <span>
              Master Password:{' '}
              <strong className="text-zinc-300 font-normal">
                {settings.hasPassword ? 'Protected' : 'Local Unencrypted'}
              </strong>
            </span>
            <span>
              Auto-Lock:{' '}
              <strong className="text-zinc-300 font-normal">
                {settings.autoLockMinutes > 0 ? `${settings.autoLockMinutes}m` : 'Disabled'}
              </strong>
            </span>
            <span>
              Cipher:{' '}
              <strong className="text-zinc-300 font-normal">AES-256-GCM</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Zero-Knowledge Offline Vault</span>
          </div>
        </footer>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar
        privacyMaskEnabled={settings.privacyMaskEnabled}
        onOpenScanModal={() => setScanModalOpen(true)}
        onOpenManualModal={() => {
          setEditingToken(null);
          setManualModalOpen(true);
        }}
        onTogglePrivacyMask={() =>
          handleUpdateSettings({
            ...settings,
            privacyMaskEnabled: !settings.privacyMaskEnabled,
          })
        }
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
      />

      {/* Modals */}
      <QrScannerModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onSaveToken={handleSaveToken}
        onBatchImport={handleBatchImport}
        soundEnabled={settings.soundEnabled}
        hapticEnabled={settings.hapticEnabled}
      />

      <ManualEntryModal
        isOpen={manualModalOpen}
        onClose={() => {
          setManualModalOpen(false);
          setEditingToken(null);
        }}
        onSaveToken={handleSaveToken}
        editingToken={editingToken}
      />

      <TokenDetailModal
        token={activeDetailToken}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setActiveDetailToken(null);
        }}
        onDelete={handleDeleteToken}
        soundEnabled={settings.soundEnabled}
        hapticEnabled={settings.hapticEnabled}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        tokens={tokens}
        onUpdateSettings={handleUpdateSettings}
        onSetupPassword={handleSetupPassword}
        onRemovePassword={handleRemovePassword}
        onRestoreTokens={persistTokens}
        onResetAllData={handleResetAllData}
      />
    </div>
  );

}

export default function Page() {
  return (
    <ToastProvider>
      <MotionConfig reducedMotion="user">
        <AuthenticatorApp />
      </MotionConfig>
    </ToastProvider>
  );
}
