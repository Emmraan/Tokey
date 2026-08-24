// Zero-Knowledge Web Crypto Utilities (AES-GCM-256 + PBKDF2)

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function generateRandomBytes(length: number = 16): Uint8Array {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // fallback for SSR
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function computeHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

export async function encryptData(plainText: string, key: CryptoKey): Promise<{ cipherText: string; ivHex: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const iv = generateRandomBytes(12); // standard 96-bit IV for AES-GCM

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  );

  return {
    cipherText: bufferToHex(cipherBuffer),
    ivHex: bufferToHex(iv),
  };
}

export async function decryptData(cipherTextHex: string, ivHex: string, key: CryptoKey): Promise<string> {
  const cipherBuffer = hexToBuffer(cipherTextHex);
  const iv = hexToBuffer(ivHex);

  const plainBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    cipherBuffer as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
}

// Encrypt payload with a raw password string directly (convenience for backups)
export async function encryptWithPassword(plainText: string, password: string): Promise<{ cipherText: string; ivHex: string; saltHex: string }> {
  const salt = generateRandomBytes(16);
  const key = await deriveKey(password, salt);
  const { cipherText, ivHex } = await encryptData(plainText, key);
  return {
    cipherText,
    ivHex,
    saltHex: bufferToHex(salt),
  };
}

// Decrypt payload with a raw password string directly (convenience for backups)
export async function decryptWithPassword(cipherText: string, ivHex: string, saltHex: string, password: string): Promise<string> {
  const salt = hexToBuffer(saltHex);
  const key = await deriveKey(password, salt);
  return await decryptData(cipherText, ivHex, key);
}
