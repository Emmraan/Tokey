'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Home, KeyRound, ShieldCheck } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)] relative overflow-hidden">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-sky-500/10 blur-3xl pointer-events-none"
      />

      <motion.div
        role="main"
        aria-labelledby="notfound-title"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative surface-elevated rounded-2xl px-8 py-10 sm:px-14 sm:py-12 text-center max-w-md w-full"
      >
        {/* Icon stack */}
        <div className="relative w-fit mx-auto mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-inner">
            <KeyRound className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <p className="mono text-[11px] uppercase tracking-[0.3em] text-zinc-500 mb-2">
          Error Code
        </p>
        <h1 id="notfound-title" className="mono text-6xl font-bold text-white tracking-widest mb-3">
          404
        </h1>

        <h2 className="text-sm font-semibold text-zinc-200 mb-1.5">
          This page isn&apos;t in your vault
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed mb-7">
          The link you followed doesn&apos;t exist or may have been moved.
          Your keys are safe — this route just isn&apos;t one of them.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-semibold text-xs transition-all shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          Back to Vault
        </Link>

        <p className="mono text-[10px] text-zinc-600 mt-6 tracking-wider">
          Your keys. Your vault.
        </p>
      </motion.div>
    </div>
  );
}
