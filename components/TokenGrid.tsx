'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Token, VaultSettings } from '@/lib/types';
import { TokenCard } from './TokenCard';
import {
  SearchX,
  QrCode,
  Plus,
  KeyRound,
  Star,
  Layers,
  Upload,
} from 'lucide-react';

interface TokenGridProps {
  tokens: Token[];
  settings: VaultSettings;
  searchQuery: string;
  selectedCategory: string;
  onPinToggle: (token: Token) => void;
  onEdit: (token: Token) => void;
  onDelete: (token: Token) => void;
  onShowQr: (token: Token) => void;
  onIncrementHotp: (token: Token) => void;
  onOpenScanModal: () => void;
  onOpenManualModal: () => void;
  onOpenSettingsModal: () => void;
}

export function TokenGrid({
  tokens,
  settings,
  searchQuery,
  selectedCategory,
  onPinToggle,
  onEdit,
  onDelete,
  onShowQr,
  onIncrementHotp,
  onOpenScanModal,
  onOpenManualModal,
  onOpenSettingsModal,
}: TokenGridProps) {
  // Filter tokens by query and category
  const filteredTokens = React.useMemo(() => {
    return tokens.filter((t) => {
      // Category filter
      if (selectedCategory === 'PINNED' && !t.isPinned) return false;
      if (
        selectedCategory !== 'ALL' &&
        selectedCategory !== 'PINNED' &&
        t.category !== selectedCategory
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const issuer = (t.issuer || '').toLowerCase();
        const account = (t.account || '').toLowerCase();
        const category = (t.category || '').toLowerCase();
        return issuer.includes(q) || account.includes(q) || category.includes(q);
      }

      return true;
    });
  }, [tokens, searchQuery, selectedCategory]);

  // Split into pinned and normal if in 'ALL' view and not searching
  const pinnedTokens = React.useMemo(
    () => filteredTokens.filter((t) => t.isPinned),
    [filteredTokens]
  );
  const otherTokens = React.useMemo(
    () => filteredTokens.filter((t) => !t.isPinned),
    [filteredTokens]
  );

  // If vault is completely empty
  if (tokens.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/30 rounded-3xl p-8 sm:p-12 border border-zinc-800/80 text-center shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 mx-auto flex items-center justify-center mb-6 shadow-inner">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
            Vault is Ready
          </h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-8 leading-relaxed">
            Securely add your two-factor authentication accounts using your device camera or a secret key.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs mx-auto">
            <button
              onClick={onOpenScanModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-zinc-200 active:scale-95 text-zinc-950 font-semibold text-sm transition-all shadow-sm cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>
            <button
              onClick={onOpenManualModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-sm border border-zinc-800 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Manual Entry</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If search / filter returned 0 results
  if (filteredTokens.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 mx-auto flex items-center justify-center mb-3">
          <SearchX className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">
          No matching accounts
        </h3>
        <p className="text-xs text-zinc-500">
          No security tokens matched &quot;{searchQuery || selectedCategory}&quot;.
        </p>
      </div>
    );
  }

  const gridClass = settings.compactView
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 z-10'
    : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 z-10';

  return (
    <div className="space-y-6 pb-12">
      {/* Pinned Section (if any & in ALL view) */}
      {selectedCategory === 'ALL' && pinnedTokens.length > 0 && otherTokens.length > 0 ? (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Favorites ({pinnedTokens.length})</span>
            </div>
            <motion.div layout className={gridClass}>
              <AnimatePresence mode="popLayout">
                {pinnedTokens.map((token) => (
                  <TokenCard
                    key={token.id}
                    token={token}
                    privacyMaskEnabled={settings.privacyMaskEnabled}
                    compactView={settings.compactView}
                    soundEnabled={settings.soundEnabled}
                    hapticEnabled={settings.hapticEnabled}
                    onPinToggle={onPinToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onShowQr={onShowQr}
                    onIncrementHotp={onIncrementHotp}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Accounts ({otherTokens.length})</span>
            </div>
            <motion.div layout className={gridClass}>
              <AnimatePresence mode="popLayout">
                {otherTokens.map((token) => (
                  <TokenCard
                    key={token.id}
                    token={token}
                    privacyMaskEnabled={settings.privacyMaskEnabled}
                    compactView={settings.compactView}
                    soundEnabled={settings.soundEnabled}
                    hapticEnabled={settings.hapticEnabled}
                    onPinToggle={onPinToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onShowQr={onShowQr}
                    onIncrementHotp={onIncrementHotp}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      ) : (
        <motion.div layout className={gridClass}>
          <AnimatePresence mode="popLayout">
            {filteredTokens.map((token) => (
              <TokenCard
                key={token.id}
                token={token}
                privacyMaskEnabled={settings.privacyMaskEnabled}
                compactView={settings.compactView}
                soundEnabled={settings.soundEnabled}
                hapticEnabled={settings.hapticEnabled}
                onPinToggle={onPinToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onShowQr={onShowQr}
                onIncrementHotp={onIncrementHotp}
              />
            ))}

            {/* Quick Action Import Card in Grid */}
            <div
              onClick={onOpenSettingsModal}
              className="bg-transparent rounded-2xl p-4 relative group cursor-pointer hover:bg-zinc-900/30 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/80 hover:border-zinc-700 min-h-[140px] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Upload className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </div>
              <p className="text-sm text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">
                Import Backup
              </p>
            </div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

