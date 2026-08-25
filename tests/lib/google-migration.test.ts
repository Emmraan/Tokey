import { describe, expect, it } from 'vitest';
import { parseGoogleMigrationUri } from '@/lib/google-migration';

describe('parseGoogleMigrationUri', () => {
  it('returns an empty array for non-migration URIs', () => {
    expect(parseGoogleMigrationUri('otpauth://totp/GitHub:user@example.com?secret=JBSWY3DPEHPK3PXP')).toEqual([]);
    expect(parseGoogleMigrationUri('https://example.com')).toEqual([]);
  });

  it('returns an empty array when the data parameter is missing', () => {
    expect(parseGoogleMigrationUri('otpauth-migration://offline?data=')).toEqual([]);
  });

  it('returns an empty array for corrupted base64 payloads', () => {
    expect(parseGoogleMigrationUri('otpauth-migration://offline?data=%2F%2F%2Fnot-base64%40%40')).toEqual([]);
  });
});
