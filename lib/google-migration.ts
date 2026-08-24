import protobuf from 'protobufjs';
import { bytesToBase32 } from './otp';
import { GoogleMigrationAccount, OtpAlgorithm, OtpType } from './types';

// Protobuf definition for Google Authenticator offline migration payload
const protoDefinition = `
syntax = "proto3";

message MigrationPayload {
  enum Algorithm {
    ALGO_UNSPECIFIED = 0;
    ALGO_SHA1 = 1;
    ALGO_SHA256 = 2;
    ALGO_SHA512 = 3;
    ALGO_MD5 = 4;
  }

  enum DigitCount {
    DIGIT_COUNT_UNSPECIFIED = 0;
    DIGIT_COUNT_SIX = 1;
    DIGIT_COUNT_EIGHT = 2;
  }

  enum OtpType {
    OTP_TYPE_UNSPECIFIED = 0;
    OTP_TYPE_HOTP = 1;
    OTP_TYPE_TOTP = 2;
  }

  message OtpParameters {
    bytes secret = 1;
    string name = 2;
    string issuer = 3;
    Algorithm algorithm = 4;
    DigitCount digits = 5;
    OtpType type = 6;
    int64 counter = 7;
  }

  repeated OtpParameters otp_parameters = 1;
  int32 version = 2;
  int32 batch_size = 3;
  int32 batch_index = 4;
  int32 batch_id = 5;
}
`;

let root: protobuf.Root | null = null;
let MigrationPayloadType: protobuf.Type | null = null;

function getPayloadType(): protobuf.Type {
  if (!MigrationPayloadType) {
    root = protobuf.parse(protoDefinition).root;
    MigrationPayloadType = root.lookupType('MigrationPayload');
  }
  return MigrationPayloadType;
}

export function parseGoogleMigrationUri(uriString: string): GoogleMigrationAccount[] {
  try {
    const cleanUri = uriString.trim();
    if (!cleanUri.startsWith('otpauth-migration://offline?data=')) {
      return [];
    }

    const url = new URL(cleanUri);
    const dataParam = url.searchParams.get('data');
    if (!dataParam) return [];

    // Decode URL-safe or standard Base64
    let base64 = decodeURIComponent(dataParam);
    base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const payloadType = getPayloadType();
    const decodedMessage = payloadType.decode(bytes) as any;
    const payload = payloadType.toObject(decodedMessage, {
      enums: String,
      bytes: String,
    });

    if (!payload.otpParameters || !Array.isArray(payload.otpParameters)) {
      return [];
    }

    const accounts: GoogleMigrationAccount[] = [];

    for (const item of payload.otpParameters) {
      // Secret is byte array or base64 string
      let secretBytes: Uint8Array;
      if (typeof item.secret === 'string') {
        const bin = atob(item.secret);
        secretBytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) {
          secretBytes[j] = bin.charCodeAt(j);
        }
      } else if (item.secret instanceof Uint8Array) {
        secretBytes = item.secret;
      } else {
        secretBytes = new Uint8Array(item.secret || []);
      }

      const base32Secret = bytesToBase32(secretBytes);
      if (!base32Secret) continue;

      let name = item.name || '';
      let issuer = item.issuer || '';

      if (name.includes(':')) {
        const parts = name.split(':');
        if (!issuer) issuer = parts[0];
        name = parts.slice(1).join(':').trim();
      }

      let algorithm: OtpAlgorithm = 'SHA1';
      if (item.algorithm === 'ALGO_SHA256' || item.algorithm === 2) algorithm = 'SHA256';
      if (item.algorithm === 'ALGO_SHA512' || item.algorithm === 3) algorithm = 'SHA512';

      let digits = 6;
      if (item.digits === 'DIGIT_COUNT_EIGHT' || item.digits === 2 || item.digits === 8) {
        digits = 8;
      }

      let type: OtpType = 'totp';
      if (item.type === 'OTP_TYPE_HOTP' || item.type === 1) {
        type = 'hotp';
      }

      accounts.push({
        secret: base32Secret,
        name: name || 'Account',
        issuer: issuer || 'Unknown Service',
        algorithm,
        digits,
        type,
        counter: item.counter ? Number(item.counter) : 0,
      });
    }

    return accounts;
  } catch (err) {
    console.error('Failed to parse Google Authenticator migration payload:', err);
    return [];
  }
}
