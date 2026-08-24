'use client';

// WebAuthn Passkey Registration & Authentication for Biometric Unlock

export async function isWebAuthnSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerPasskey(userId: string = 'tokey-user'): Promise<string | null> {
  if (!(await isWebAuthnSupported())) {
    throw new Error('Biometric Passkeys are not supported on this device/browser.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userIdBytes = new TextEncoder().encode(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'TOKEY Web Authenticator',
      id: window.location.hostname,
    },
    user: {
      id: userIdBytes,
      name: 'tokey_vault_owner',
      displayName: 'TOKEY Vault Owner',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) return null;
    return credential.id;
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric registration was cancelled.');
    }
    throw err;
  }
}

export async function authenticatePasskey(credentialId?: string): Promise<boolean> {
  if (!(await isWebAuthnSupported())) {
    return false;
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    userVerification: 'required',
    rpId: window.location.hostname,
  };

  if (credentialId) {
    publicKeyCredentialRequestOptions.allowCredentials = [
      {
        id: new TextEncoder().encode(credentialId),
        type: 'public-key',
        transports: ['internal'],
      },
    ];
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });
    return !!assertion;
  } catch (err: any) {
    console.warn('Biometric auth failed or cancelled:', err);
    return false;
  }
}
