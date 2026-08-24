# TOKEY

Zero-knowledge, offline-first 2FA authenticator for TOTP & HOTP tokens, with camera QR scanning, an encrypted vault, and cloud sync.

## Features

- TOTP & HOTP token support
- Camera QR code scanning
- Google Authenticator migration QR import (batch)
- Encrypted local vault (WebAuthn-protected lock screen)
- Cloud sync
- Manual token entry

## Getting Started

**Prerequisites:** Node.js (with Corepack) or pnpm

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run the app in development mode:

   ```bash
   pnpm dev
   ```

3. Build for production:

   ```bash
   pnpm build
   ```

## Scripts

| Script         | Description                |
| -------------- | -------------------------- |
| `pnpm dev`     | Start the dev server       |
| `pnpm build`   | Create a production build  |
| `pnpm start`   | Serve the production build |
| `pnpm lint`    | Run ESLint                 |
