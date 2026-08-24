import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TOKEY — Zero-Knowledge 2FA Web Authenticator',
  description: 'Production-grade, offline-first 2FA Authenticator for TOTP & HOTP security tokens with zero-knowledge AES-GCM-256 encryption.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'TOKEY — Zero-Knowledge 2FA Web Authenticator',
    description: 'Secure, modern, and beautiful client-side Web Authenticator with QR camera scanning and zero-knowledge encryption.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOKEY — 2FA Web Authenticator',
    description: 'Zero-knowledge 2FA Authenticator for TOTP & HOTP tokens.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0F19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#0B0F19] antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var currentFetch = window.fetch;
                  Object.defineProperty(window, 'fetch', {
                    configurable: true,
                    enumerable: true,
                    get: function() {
                      return currentFetch;
                    },
                    set: function(val) {
                      currentFetch = val;
                    }
                  });
                } catch (e) {
                  console.warn('Safeguard fetch setter exception:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-[#0B0F19] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

