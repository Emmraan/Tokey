# AGENTS.md — TOKEY

Single source of truth for AI agents working in this repository. Read this file
first before touching anything. `CLAUDE.md` is a thin pointer back here.

## Project

**TOKEY** — a zero-knowledge, offline-first 2FA authenticator PWA for TOTP &
HOTP tokens. All secrets live in the browser (IndexedDB); there is no backend,
no accounts, and no telemetry.

- Tagline: *"Your keys. Your vault."*
- Stack: Next.js 15 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4.
- Storage: IndexedDB via `idb-keyval`. Vault is encrypted with AES-256-GCM
  (PBKDF2-derived key) when the user sets a master password; otherwise plaintext
  local storage.
- Unlock methods: master password/PIN, WebAuthn passkey (TouchID/FaceID/Windows Hello).
- OTP engine: the `otpauth` npm package (`lib/otp.ts`).
- QR scanning: camera stream + `jsqr` (`components/QrScannerModal.tsx`, `lib/qr-decoder.ts`).
- Google Authenticator batch import: `otpauth-migration://` protobuf decoding via
  `protobufjs` (`lib/google-migration.ts`).
- Deploy target: static-friendly Vercel hosting. Package manager: **pnpm**.
- License: MIT.

## Security rules (non-negotiable)

1. **Never log, console-print, or transmit token secrets or derived keys.**
2. Plaintext export flows MUST keep their destructive-action `window.confirm()`
   warnings. Never remove them to "improve UX".
3. No new network calls that carry vault data off-device. Cloud sync stays a
   client-side encrypted snapshot unless a spec says otherwise.
4. Crypto changes only in `lib/crypto.ts`; never hand-roll crypto elsewhere.
5. Never commit `.env*`, real secrets, or user-exported backup files.

## Workflow

1. **Research first.** Read the relevant `lib/` module and component before
   editing. Follow existing patterns (see Conventions).
2. **Conventional Commits** on every commit: `feat:`, `fix:`, `chore:`, `docs:`…
3. **`pnpm` only.** Do not add package managers or lockfiles other than
   `pnpm-lock.yaml`.
4. **Verify after every change:** run `pnpm lint` and `npx tsc --noEmit`.
   Run `pnpm build` before declaring a task done if you touched imports,
   routing, config, or anything server-side.
5. **No test framework exists yet.** If you add one (Vitest preferred), update
   this file's Commands table in the same PR.

## Repo layout

| Path | Description |
|---|---|
| `app/page.tsx`, `app/layout.tsx`, `app/globals.css` | Single-page app shell; design tokens (`surface-card`, `surface-elevated`, `.mono`, `.no-scrollbar`) |
| `components/` | Feature components: `Header`, `Sidebar`, `TokenGrid`, `TokenCard`, `TokenDetailModal`, `ManualEntryModal`, `QrScannerModal`, `SettingsModal`, `VaultLockScreen`, `NotificationToast`, `MobileTabBar`, `PwaRegister` |
| `lib/types.ts` | Core types: `Token`, `VaultSettings`, `BackupPayload`, `EncryptedBackupFile`, `GoogleMigrationAccount` |
| `lib/otp.ts` | TOTP/HOTP generation, Base32 helpers, `parseOtpAuthUri()` / `buildOtpAuthUri()` |
| `lib/storage.ts` | IndexedDB persistence + encrypted vault read/write (`tokey_*` storage keys) |
| `lib/crypto.ts` | AES-256-GCM encrypt/decrypt, PBKDF2 key derivation, hex utils |
| `lib/webauthn.ts` | Passkey registration & authentication |
| `lib/cloud-sync.ts` | Encrypted/plaintext/CSV backups, `downloadFile()`, `mergeTokens()` dedup |
| `lib/google-migration.ts` | Google Authenticator `otpauth-migration://` protobuf parser |
| `lib/import-parsers.ts` | Universal import auto-detection (TOKEY JSON, Ente exports, plain-text otpauth URIs) |
| `lib/qr-decoder.ts` | Image/camera QR decoding via jsqr |
| `lib/sound.ts`, `lib/brand-icons.tsx`, `lib/utils.ts` | Audio feedback, issuer brand icons, class merge |
| `public/manifest.json`, `public/sw.js`, `scripts/generate-icons.mjs` | PWA shell |

## Data model notes

- `Token.secret` is always **Base32** (uppercase). Use `sanitizeBase32Secret()`
  / `isValidBase32()` from `lib/otp.ts` at every entry point.
- Token identity for dedup = `` `${issuer}:${account}:${secret}` `` (lowercased)
  — keep `mergeTokens()` in `lib/cloud-sync.ts` as the single merge path so
  manual add, QR import, and file import all dedup identically.
- New tokens need: generated id (`tokey-<ts>-<rand>`), category default
  `'Personal'`, algorithm default `SHA1`, digits `6`, period `30`, type `totp`,
  `createdAt`/`updatedAt` timestamps.

## Import/export formats

- TOKEY encrypted backup: JSON `{ appName: 'TOKEY_ENCRYPTED', saltHex, ivHex, cipherText }`.
- TOKEY plaintext backup: `{ appName: 'TOKEY', tokens: [...] }`.
- Ente unencrypted export: JSON `{ items: [{ code: 'otpauth://…', pinned }] }`
  (file usually named `ente-auth.txt`).
- Ente *encrypted* export (`kdfParams`/`encryptedData`) is intentionally NOT
  supported — show a helpful error instead of attempting Argon2/XChaCha20.
- Plain text import: one `otpauth://` URI per line, commas or newlines as
  separators; `otpauth-migration://offline?data=…` lines expand to batch imports.

## UI conventions

- Dark-only zinc palette; use `surface-card` / `surface-elevated` utility classes
  from `app/globals.css`, not ad-hoc backgrounds.
- Animations via `motion/react`; icons via `lucide-react`; brand icons via
  `RenderAccountIcon` in `lib/brand-icons.tsx`.
- User feedback through the toast system: `useToast()` from
  `components/NotificationToast.tsx` — never raw `alert()` except where a
  blocking confirm already exists.
- Modals follow the pattern in `ManualEntryModal.tsx`: fixed overlay +
  `motion.div` dialog + labelled close button.
- Keep text inputs for secrets uppercase/tracking-wider with mono font.

## Commands

| Task | Command |
|---|---|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` |
| Typecheck | `npx tsc --noEmit` |
| Production build | `pnpm build` |
| Regenerate PWA icons | `pnpm icons` |
