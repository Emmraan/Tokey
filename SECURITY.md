# Security Policy

TOKEY is a security tool first: it stores your 2FA secrets. If you find a
vulnerability, we want to hear about it.

## Supported versions

| Version | Supported |
| --- | --- |
| latest `main` | yes |
| older tags/commits | no |

Always run the newest code from `main` or a current release.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security reports.**

1. Use GitHub's private vulnerability reporting:
   **Security tab → Report a vulnerability** on
   [Emmraan/Tokey](https://github.com/Emmraan/Tokey/security), **or**
2. Contact the maintainer directly through the email listed on the
   [GitHub profile](https://github.com/Emmraan).

Include: affected area, reproduction steps, impact assessment, and any proof
of concept. You will get an acknowledgement within **7 days**, and a fix
timeline once the report is triaged. Credit is given in the release notes
unless you prefer to stay anonymous.

## Security model

Understanding what TOKEY does — and does not — protect against:

- **Zero-knowledge storage.** Tokens live only in your browser's IndexedDB.
  There is no backend, no account, and no telemetry.
- **At-rest encryption (optional).** Setting a master password encrypts the
  vault with AES-256-GCM using a PBKDF2-derived key (Web Crypto). Without a
  master password, tokens are stored unencrypted in local storage.
- **Unlock methods.** Master password/PIN or a WebAuthn passkey
  (TouchID / FaceID / Windows Hello).
- **Backups are your responsibility.** Plaintext JSON/CSV exports contain
  unencrypted secrets by definition; they always require an explicit
  confirmation before download. Encrypted exports require a backup password.
- **Threat model NOT covered:** malware on your device, a compromised browser,
  someone with physical access to an unlocked session, or XSS in third-party
  dependencies. TOKEY cannot defend against a fully compromised client.

## Scope notes for researchers

- Secrets must never be logged, transmitted, or persisted outside IndexedDB.
  Any path that leaks a Base32 secret, derived key, or password material is in
  scope.
- The crypto implementation lives exclusively in `lib/crypto.ts`; findings
  involving hand-rolled cryptography anywhere else are high priority.
- Service worker (`public/sw.js`) caching behaviour that could serve stale or
  tampered vault code is in scope.
