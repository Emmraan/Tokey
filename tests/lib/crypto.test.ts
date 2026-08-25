import { describe, expect, it } from 'vitest';
import { bufferToHex, generateRandomBytes, hexToBuffer } from '@/lib/crypto';

describe('bufferToHex', () => {
  it('encodes bytes as lowercase hex', () => {
    expect(bufferToHex(new Uint8Array([0, 255, 16]))).toBe('00ff10');
  });

  it('accepts an ArrayBuffer view', () => {
    const buf = new Uint8Array([171, 204]).buffer;
    expect(bufferToHex(buf)).toBe('abcc');
  });
});

describe('hexToBuffer', () => {
  it('decodes hex into bytes', () => {
    expect(Array.from(hexToBuffer('00ff10'))).toEqual([0, 255, 16]);
  });

  it('strips non-hex characters', () => {
    expect(Array.from(hexToBuffer(':00 ff!'))).toEqual([0, 255]);
  });

  it('round-trips with bufferToHex', () => {
    const bytes = new Uint8Array([1, 2, 3, 200, 201]);
    expect(hexToBuffer(bufferToHex(bytes))).toEqual(bytes);
  });
});

describe('generateRandomBytes', () => {
  it('generates the requested number of bytes', () => {
    expect(generateRandomBytes(32)).toHaveLength(32);
  });

  it('defaults to 16 bytes', () => {
    expect(generateRandomBytes()).toHaveLength(16);
  });

  it('produces values within byte range', () => {
    const bytes = generateRandomBytes(64);
    for (const b of bytes) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('produces distinct buffers across calls', () => {
    const a = Buffer.from(generateRandomBytes(32)).toString('hex');
    const b = Buffer.from(generateRandomBytes(32)).toString('hex');
    expect(a).not.toBe(b);
  });
});
