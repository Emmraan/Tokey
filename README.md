# TOKEY

> Your keys. Your vault.

A zero-knowledge, offline-first 2FA authenticator for TOTP & HOTP tokens.
All secrets live in your browser — there is no backend, no account, and no
telemetry. Ever.

## Why TOKEY

Most authenticator apps hold your secrets on someone else's servers. TOKEY
is built on a different promise: **your 2FA vault never leaves your device.**

- **Zero-knowledge by design** — tokens are stored only in your browser's
  IndexedDB. Setting a master password encrypts the entire vault with
  AES-256-GCM using a PBKDF2-derived key (Web Crypto).
- **Fast unlock** — master password/PIN or biometric passkeys
  (TouchID / FaceID / Windows Hello) via WebAuthn.
- **Offline-first PWA** — installable, works without a network connection,
  with an offline service worker.
- **Privacy screen** — optional blur keeps codes hidden from shoulder
  surfers until you hover or tap.

## Features

| Area | What you get |
| --- | --- |
| Tokens | TOTP & HOTP, SHA-1/256/512, 6–8 digits, custom periods |
| Add accounts | Camera QR scan, image QR scan, manual entry |
| Import | Google Authenticator batch QR (`otpauth-migration://`), Ente Auth unencrypted exports (`.json`/`.txt`), plain-text `otpauth://` files — auto-detected |
| Export | Encrypted JSON backup (password protected), plaintext JSON, spreadsheet-friendly CSV |
| Organization | Categories, pinning, search, issuer brand icons |
| Feedback | Audio clicks, haptics, confetti — all optional |

## Security model

- Secrets never leave the browser: no backend, no sync servers, no analytics.
- Master-password mode encrypts the vault at rest (AES-256-GCM + PBKDF2).
- Plaintext export flows always require an explicit confirmation before
  downloading unencrypted secrets.
- Full threat model and reporting process: [SECURITY.md](./SECURITY.md).

## Quick start

Prerequisites: **Node.js 20+** (`.nvmrc`) and **pnpm 11+** (`corepack enable`).

```bash
git clone https://github.com/Emmraan/Tokey.git
cd Tokey
pnpm install
pnpm dev        # http://localhost:3000
```

Production build:

```bash
pnpm build
pnpm start
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript check |
| `pnpm icons` | Regenerate PWA icons |

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Single-page app shell |
| Language | TypeScript 5.9 (strict) | `npx tsc --noEmit` |
| Styling | Tailwind CSS v4 | Dark zinc palette, design tokens in `globals.css` |
| Motion | motion/react | Modal & list animations |
| OTP engine | [`otpauth`](https://www.npmjs.com/package/otpauth) | RFC-compatible TOTP/HOTP |
| Storage | IndexedDB via `idb-keyval` | Encrypted or plaintext local vault |
| QR | `jsqr` + camera stream | Scan & image import |
| Batch import | `protobufjs` | Google Authenticator migration payloads |

## Importing from other apps

TOKEY auto-detects the format of any `.json` or `.txt` file you drop into
**Settings → Backup & Export → Restore Backup File**:

| Source | File | Notes |
| --- | --- | --- |
| TOKEY encrypted backup | `*.json` | Asks for the backup password |
| TOKEY plaintext backup | `*.json` | Merges with dedup |
| Ente Auth (unencrypted export) | `ente-auth.txt` / `.json` | Preserves pin state |
| Plain text | `.txt` | One `otpauth://` URI per line; commas also fine |
| Google Authenticator | migration QR | Batch import via camera/image scan |

> Ente *encrypted* exports (Argon2id + XChaCha20) are not supported — use
> Ente's unencrypted "Export codes" instead.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup,
conventions and the PR process. Security issues: [SECURITY.md](./SECURITY.md)
— please do not open public issues for vulnerabilities.

## License

[MIT](./LICENSE) © Emmraan & TOKEY contributors.
