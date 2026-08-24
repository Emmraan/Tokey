'use client';

import React from 'react';
import {
  Shield,
  Key,
  Globe,
  Lock,
  Smartphone,
  Cpu,
  Server,
  Cloud,
  Terminal,
  Zap,
} from 'lucide-react';

interface BrandConfig {
  name: string;
  color: string;
  bg: string;
  keywords: string[];
  renderIcon: (className?: string) => React.ReactNode;
}

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  google: {
    name: 'Google',
    color: '#4285F4',
    bg: '#4285F41A',
    keywords: ['google', 'gmail', 'youtube', 'gsuite', 'workspace', 'alphabet'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  github: {
    name: 'GitHub',
    color: '#F0F6FC',
    bg: '#24292F33',
    keywords: ['github', 'git', 'gh'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        />
      </svg>
    ),
  },
  microsoft: {
    name: 'Microsoft',
    color: '#00A4EF',
    bg: '#00A4EF1A',
    keywords: ['microsoft', 'azure', 'outlook', 'office', 'live.com', 'xbox', 'hotmail', 'msft'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
        <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
        <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
        <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
      </svg>
    ),
  },
  aws: {
    name: 'AWS',
    color: '#FF9900',
    bg: '#FF99001A',
    keywords: ['aws', 'amazon', 'amazon web services', 'amzn'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 13.5c-.3 0-.6-.1-.8-.3-.2-.3-.2-.6-.1-.9.3-1.1.2-2.1-.2-3.1-.3-.7-.8-1.3-1.4-1.8-.3-.2-.4-.5-.3-.8.1-.3.4-.5.7-.4.8.6 1.4 1.4 1.8 2.3.5 1.2.6 2.5.3 3.8-.1.4-.4.7-.9.7zm-4.3 0c-.3 0-.6-.1-.8-.3-.2-.3-.2-.6-.1-.9.3-1.1.2-2.1-.2-3.1-.3-.7-.8-1.3-1.4-1.8-.3-.2-.4-.5-.3-.8.1-.3.4-.5.7-.4.8.6 1.4 1.4 1.8 2.3.5 1.2.6 2.5.3 3.8-.1.4-.4.7-.9.7zM20 18.2c-2.4 1.7-5.4 2.6-8.5 2.6-4.5 0-8.6-1.8-11.5-4.8-.3-.3-.3-.8 0-1.1.3-.3.8-.3 1.1 0 2.6 2.7 6.3 4.3 10.4 4.3 2.7 0 5.4-.8 7.5-2.3.3-.2.8-.2 1 .2.3.3.2.8-.5 1.1zm1.8-1.3c-.3-.4-1.7-.8-2.6-.9-.3 0-.4-.3-.3-.5.1-.3.3-.4.6-.3 1.2.2 2.8.7 3.1 1.1.2.3.1.7-.2 1.3-.2.4-.4.7-.6.9-.2.2-.4.2-.6 0-.2-.2-.2-.4 0-.6.2-.2.3-.5.4-.7.1-.1.1-.2 0-.3z" />
      </svg>
    ),
  },
  discord: {
    name: 'Discord',
    color: '#5865F2',
    bg: '#5865F21A',
    keywords: ['discord', 'discordapp'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#F8FAFC',
    bg: '#00000033',
    keywords: ['twitter', 'x.com', 'x corp', 'tweet'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  binance: {
    name: 'Binance',
    color: '#F3BA2F',
    bg: '#F3BA2F1A',
    keywords: ['binance', 'bnb', 'binanceus'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5L7.2 7.3l2.4 2.4L12 7.3l2.4 2.4 2.4-2.4L12 2.5zm-7.3 7.2L2.3 12l2.4 2.4 2.4-2.4-2.4-2.3zm14.6 0l-2.4 2.3 2.4 2.4 2.4-2.4-2.4-2.3zM12 16.7l-2.4-2.4-2.4 2.4L12 21.5l4.8-4.8-2.4-2.4-2.4 2.4zm0-6.8L9.6 12 12 14.4 14.4 12 12 9.9z" />
      </svg>
    ),
  },
  apple: {
    name: 'Apple',
    color: '#E2E8F0',
    bg: '#A2AAAD1A',
    keywords: ['apple', 'icloud', 'appleid', 'itunes'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.74c.64-.78 1.08-1.86.96-2.95-1 .04-2.15.66-2.81 1.44-.58.67-1.1 1.76-.96 2.82 1.11.09 2.18-.55 2.81-1.31z" />
      </svg>
    ),
  },
  openai: {
    name: 'OpenAI',
    color: '#10A37F',
    bg: '#10A37F1A',
    keywords: ['openai', 'chatgpt', 'dall-e', 'sora', 'gpt'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.28 10.42a6.38 6.38 0 0 0-.54-5.18 6.47 6.47 0 0 0-6.9-3.06 6.38 6.38 0 0 0-4.66-2.07 6.47 6.47 0 0 0-6.19 4.5 6.38 6.38 0 0 0-4.13 3.1 6.47 6.47 0 0 0 .73 7.52 6.38 6.38 0 0 0 .54 5.18 6.47 6.47 0 0 0 6.9 3.06 6.38 6.38 0 0 0 4.66 2.07 6.47 6.47 0 0 0 6.19-4.5 6.38 6.38 0 0 0 4.13-3.1 6.47 6.47 0 0 0-.73-7.52zM12 21.89a4.87 4.87 0 0 1-3.15-1.15l.16-.09 5.23-3.02a.8.8 0 0 0 .4-.69v-5.96l1.79 1.03v6.07a4.9 4.9 0 0 1-4.43 3.81zm-8.32-4.1a4.87 4.87 0 0 1-.58-3.32l.16.09 5.23 3.02a.8.8 0 0 0 .8 0l5.16-2.98v2.07l-5.26 3.04a4.9 4.9 0 0 1-5.51-1.92zm-1.18-8.91a4.87 4.87 0 0 1 2.57-2.17v6.2a.8.8 0 0 0 .4.69l5.16 2.98-1.79 1.03-5.26-3.04a4.9 4.9 0 0 1-1.08-5.69zm15.74 3.04l-5.23-3.02a.8.8 0 0 0-.8 0l-5.16 2.98v-2.07l5.26-3.04a4.9 4.9 0 0 1 5.93 5.15zm2.14 5.87a4.87 4.87 0 0 1-2.57 2.17v-6.2a.8.8 0 0 0-.4-.69l-5.16-2.98 1.79-1.03 5.26 3.04a4.9 4.9 0 0 1 1.08 5.69zm-7.38-4.26l-2.48-1.43 2.48-1.43 2.48 1.43-2.48 1.43z" />
      </svg>
    ),
  },
  coinbase: {
    name: 'Coinbase',
    color: '#0052FF',
    bg: '#0052FF1A',
    keywords: ['coinbase', 'cb', 'coinbase pro'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-1.8-6.8h3.6v3.6h-3.6z" />
      </svg>
    ),
  },
  proton: {
    name: 'Proton',
    color: '#6D4AFF',
    bg: '#6D4AFF1A',
    keywords: ['proton', 'protonmail', 'protonvpn', 'protonpass'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4.5c2.49 0 4.5 2.01 4.5 4.5 0 2.22-1.61 4.07-3.72 4.43v2.07h-1.56v-2.07C9.11 15.07 7.5 13.22 7.5 11c0-2.49 2.01-4.5 4.5-4.5z" />
      </svg>
    ),
  },
  bitwarden: {
    name: 'Bitwarden',
    color: '#175DDC',
    bg: '#175DDC1A',
    keywords: ['bitwarden', 'vaultwarden', 'bitwarden.com'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1.5L3 5.5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12v-6l-9-4zm0 2.24l7 3.11v5.15c0 4.52-3 8.75-7 9.87-4-1.12-7-5.35-7-9.87V6.85l7-3.11zm-1 4.26v8h2v-8h-2z" />
      </svg>
    ),
  },
  gitlab: {
    name: 'GitLab',
    color: '#FC6D26',
    bg: '#FC6D261A',
    keywords: ['gitlab'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51c.06-.18.2-.33.38-.41a.87.87 0 0 1 .9.09.84.84 0 0 1 .28.47l2.12 6.5h7.22l2.12-6.5a.84.84 0 0 1 .28-.47.87.87 0 0 1 .9-.09c.18.08.32.23.38.41l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z" />
      </svg>
    ),
  },
  slack: {
    name: 'Slack',
    color: '#E01E5A',
    bg: '#E01E5A1A',
    keywords: ['slack'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.04 14.65a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 0 1 5.04 0v6.3a2.52 2.52 0 1 1-5.04 0v-6.3zm3.78-8.41a2.52 2.52 0 1 1 2.52-2.52v2.52H10.08zm0 1.26a2.52 2.52 0 0 1 0 5.04H3.78a2.52 2.52 0 1 1 0-5.04h6.3zm8.41 3.78a2.52 2.52 0 1 1 2.52 2.52h-2.52v-2.52zm-1.26 0a2.52 2.52 0 0 1-5.04 0V5.04a2.52 2.52 0 1 1 5.04 0v6.3zm-3.78 8.41a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 0 1 0-5.04h6.3a2.52 2.52 0 1 1 0 5.04h-6.3z" />
      </svg>
    ),
  },
  stripe: {
    name: 'Stripe',
    color: '#635BFF',
    bg: '#635BFF1A',
    keywords: ['stripe'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.977 15.688.4 12.986.4 7.625.4 3.75 3.328 3.75 8.16c0 5.17 4.708 6.786 8.528 8.17 2.456.88 3.42 1.636 3.42 2.657 0 1.004-.897 1.573-2.316 1.573-2.61 0-5.46-1.196-7.39-2.274l-.942 5.484c1.884.975 4.887 1.83 7.848 1.83 5.753 0 9.774-2.822 9.774-7.85 0-5.466-4.697-6.924-8.696-8.698z" />
      </svg>
    ),
  },
  steam: {
    name: 'Steam',
    color: '#171A21',
    bg: '#171A2133',
    keywords: ['steam', 'valvesoftware', 'valve'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.83 3.43 8.87 8 9.8v-7.1l-2.3-2.3c-.6.3-1.4.2-1.9-.3-.7-.7-.7-1.8 0-2.5s1.8-.7 2.5 0c.5.5.6 1.3.3 1.9l2.3 2.3h2.3l4.2-6.1c0-.4-.1-.8-.1-1.2 0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4c-.4 0-.8-.1-1.2-.1L14 16.5v2.3l-2.3 2.3C11.8 21.9 11.9 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
      </svg>
    ),
  },
  twitch: {
    name: 'Twitch',
    color: '#9146FF',
    bg: '#9146FF1A',
    keywords: ['twitch', 'twitch.tv'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 2L3 5.5v14h4.5v3h3l3-3h3.5L21 14.5V2H4.5zm14.5 11.5l-2.5 2.5H13l-3 3v-3H6.5V4h12.5v9.5zM15 7.5h2v5h-2zm-5 0h2v5h-2z" />
      </svg>
    ),
  },
  reddit: {
    name: 'Reddit',
    color: '#FF4500',
    bg: '#FF45001A',
    keywords: ['reddit'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm6.2 11.5c.3 0 .5.2.5.5 0 1.9-2.3 3.5-5.2 3.5s-5.2-1.6-5.2-3.5c0-.3.2-.5.5-.5s.5.2.5.5c0 1.4 1.9 2.5 4.2 2.5s4.2-1.1 4.2-2.5c0-.3.2-.5.5-.5zm-8.7-2c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm6 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
      </svg>
    ),
  },
  cloudflare: {
    name: 'Cloudflare',
    color: '#F38020',
    bg: '#F380201A',
    keywords: ['cloudflare', 'cf'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.8 11.2c-.3-2.6-2.5-4.7-5.2-4.7-2 0-3.8 1.1-4.7 2.8C8.4 9.1 7.7 9 7 9c-2.8 0-5 2.2-5 5 0 2.8 2.2 5 5 5h11.5c2.5 0 4.5-2 4.5-4.5 0-2.1-1.5-3.9-3.5-4.3l-.7-.1z" />
      </svg>
    ),
  },
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    bg: '#1DB9541A',
    keywords: ['spotify'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.58 14.42c-.18.3-.56.39-.86.21-2.36-1.44-5.33-1.76-8.83-.96-.34.08-.68-.14-.76-.48-.08-.34.14-.68.48-.76 3.84-.88 7.12-.52 9.76 1.12.3.19.4.57.21.87zm1.22-2.72c-.23.37-.71.49-1.08.26-2.7-1.66-6.82-2.14-10.02-1.17-.41.12-.85-.11-.97-.53-.12-.41.11-.85.53-.97 3.66-1.11 8.2-.58 11.28 1.32.37.23.49.71.26 1.09zm.11-2.83c-3.24-1.92-8.58-2.1-11.69-1.16-.5.15-1.02-.14-1.17-.63-.15-.5.14-1.02.63-1.17 3.59-1.09 9.48-.88 13.2 1.33.45.27.6.85.33 1.3-.27.45-.85.6-1.3.33z" />
      </svg>
    ),
  },
  notion: {
    name: 'Notion',
    color: '#F8FAFC',
    bg: '#FFFFFF1A',
    keywords: ['notion'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l11.459-.84c1.12-.093 1.494.374 1.214 1.307l-2.053 13.065c-.187 1.12-.747 1.587-2.053 1.68l-12.019.747c-1.307.093-1.774-.374-1.494-1.494l2.518-14.931zm3.173 3.64l-1.307 8.307 1.68-.093.84-5.32 3.827 5.04 2.893-.187 1.4-8.867-1.68.093-.84 5.6-3.827-4.853-2.986.28z" />
      </svg>
    ),
  },
  telegram: {
    name: 'Telegram',
    color: '#24A1DE',
    bg: '#24A1DE1A',
    keywords: ['telegram', 'tg'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
      </svg>
    ),
  },
  dropbox: {
    name: 'Dropbox',
    color: '#0061FF',
    bg: '#0061FF1A',
    keywords: ['dropbox'],
    renderIcon: (className = 'w-5 h-5') => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.02 2L1 6.37l6.02 4.38 6.02-4.38L7.02 2zm9.96 0l-6.02 4.37 6.02 4.38 6.02-4.38L16.98 2zM1 15.13l6.02 4.38 6.02-4.38-6.02-4.38L1 15.13zm15.98-4.38l-6.02 4.38 6.02 4.38 6.02-4.38-6.02-4.38zM7.02 20.62L12 17l4.98 3.62L12 24.25l-4.98-3.63z" />
      </svg>
    ),
  },
};

// Color palettes for dynamically assigned monogram avatars with refined neutral tones
export const MONOGRAM_PALETTES = [
  { bg: 'bg-zinc-800 text-zinc-200 border-zinc-700/80' },
  { bg: 'bg-stone-800 text-stone-200 border-stone-700/80' },
  { bg: 'bg-slate-800 text-slate-200 border-slate-700/80' },
  { bg: 'bg-neutral-800 text-neutral-200 border-neutral-700/80' },
  { bg: 'bg-zinc-900 text-zinc-300 border-zinc-700/60' },
  { bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' },
  { bg: 'bg-sky-950/40 text-sky-300 border-sky-800/40' },
  { bg: 'bg-amber-950/40 text-amber-300 border-amber-800/40' },
];

export function getBrandMatch(issuer: string, account: string): BrandConfig | null {
  const query = `${issuer} ${account}`.toLowerCase();

  for (const key of Object.keys(BRAND_CONFIGS)) {
    const config = BRAND_CONFIGS[key];
    if (config.keywords.some((kw) => query.includes(kw))) {
      return config;
    }
  }

  return null;
}

export function getMonogram(name: string): string {
  if (!name) return '??';
  const clean = name.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getMonogramStyle(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MONOGRAM_PALETTES.length;
  return MONOGRAM_PALETTES[index];
}

export function RenderAccountIcon({
  issuer,
  account,
  customIcon,
  className = 'w-9 h-9',
  iconSize = 'w-4 h-4',
}: {
  issuer: string;
  account: string;
  customIcon?: string;
  className?: string;
  iconSize?: string;
}) {
  const brand = getBrandMatch(issuer, account);

  if (brand) {
    return (
      <div
        className={`${className} rounded-lg flex items-center justify-center border border-white/10 shrink-0 shadow-sm transition-transform duration-150 group-hover:scale-105 bg-zinc-900/90`}
        style={{ color: brand.color }}
      >
        {brand.renderIcon(iconSize)}
      </div>
    );
  }

  const monogram = getMonogram(issuer || account);
  const palette = getMonogramStyle(issuer || account);

  return (
    <div
      className={`${className} rounded-lg flex items-center justify-center font-mono font-bold text-xs border shrink-0 transition-transform duration-150 group-hover:scale-105 ${palette.bg}`}
    >
      {monogram}
    </div>
  );
}

