# Contributing to TOKEY

Thanks for helping build a better zero-knowledge authenticator. This guide
covers everything needed to get a PR merged.

## Project context (read first)

- **[AGENTS.md](./AGENTS.md)** — single source of truth: architecture, security
  rules, data model, UI conventions. Every contributor (human or AI) should read
  it before the first change.
- **[SECURITY.md](./SECURITY.md)** — how to report vulnerabilities and what the
  threat model is.

## Development setup

Prerequisites: **Node.js 20+** and **pnpm 11+** (`corepack enable`).

```bash
git clone https://github.com/Emmraan/Tokey.git
cd Tokey
pnpm install
pnpm dev        # http://localhost:3000
```

## Before every commit

| Check | Command |
| --- | --- |
| Lint | `pnpm lint` |
| Typecheck | `npx tsc --noEmit` |
| Production build (routing/config changes) | `pnpm build` |

All three must pass. CI runs the same gates on every push and PR.

## Ground rules

1. **Security is non-negotiable** — see AGENTS.md "Security rules". Never log
   secrets; keep plaintext-export confirmations; crypto only in `lib/crypto.ts`.
2. **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`…) — commit
   messages should describe *why*, not just *what*.
3. **`pnpm` only.** No other package managers or lockfiles.
4. **Follow existing patterns.** Design tokens (`surface-card`,
   `surface-elevated`), `motion/react` animations, `lucide-react` icons, and
   the toast system (`useToast()`) exist for a reason — use them.
5. **Token identity & dedup** go through `mergeTokens()` in
   `lib/cloud-sync.ts`. New import paths must reuse it.

## How to submit

1. Fork the repo / create a branch off `main`
   (`feat/my-feature`, `fix/my-bugfix`).
2. Make your change in small, focused commits.
3. Verify with the three commands above.
4. Open a Pull Request with:
   - what changed and why,
   - screenshots/GIFs for UI changes,
   - manual test steps you performed.

## Good first contributions

Not sure where to start?

- Import/export format support (see AGENTS.md "Import/export formats")
- Accessibility passes on modals and the token grid
- Brand icon coverage in `lib/brand-icons.tsx`
- Documentation improvements

## License

By contributing, you agree your contributions are licensed under the
[MIT License](./LICENSE).
