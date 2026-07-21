/**
 * Auth module — DID challenge-response login.
 *
 * Ports the PROVEN handshake from spike/did-auth-roundtrip.mjs.
 * CRITICAL: signs the challenge HEX STRING as UTF-8 bytes (NOT decoded hex).
 */

import * as SecureStore from 'expo-secure-store';
import { deriveDidFromPrivateKey, signChallenge } from './crypto';

const KERNEL_URL = process.env.EXPO_PUBLIC_KERNEL_URL ?? 'https://dev-jin.imajin.ai';

const STORAGE_KEY_PRIVATE = 'jin_private_key';
const STORAGE_KEY_SESSION = 'jin_session';

export interface LoginResult {
  success: boolean;
  did?: string;
  error?: string;
  mfaRequired?: boolean;
}

export interface Session {
  did: string;
  /** Opaque session token returned by the kernel */
  token: string;
}

/**
 * Perform DID challenge-response login.
 *
 * 1. POST /auth/api/login/challenge { did }
 * 2. Sign challenge hex string as UTF-8 bytes
 * 3. POST /auth/api/login/verify { challengeId, signature }
 * 4. On success, persist private key + session to SecureStore
 */
export async function login(privHex: string): Promise<LoginResult> {
  if (!/^[0-9a-fA-F]{64}$/.test(privHex)) {
    return { success: false, error: 'Invalid private key format. Must be 64 hex characters.' };
  }

  const did = await deriveDidFromPrivateKey(privHex);

  // 1. Challenge
  const challengeRes = await fetch(`${KERNEL_URL}/auth/api/login/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did }),
  });

  if (!challengeRes.ok) {
    const errText = await challengeRes.text().catch(() => 'Unknown error');
    return { success: false, error: `Challenge failed (${challengeRes.status}): ${errText}` };
  }

  const { challengeId, challenge } = await challengeRes.json();

  // 2. Sign — the challenge HEX STRING as UTF-8 bytes (load-bearing detail)
  const signature = await signChallenge(privHex, challenge);

  // 3. Verify
  const verifyRes = await fetch(`${KERNEL_URL}/auth/api/login/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId, signature }),
  });

  const verifyData = await verifyRes.json().catch(() => ({}));

  if (!verifyRes.ok) {
    return {
      success: false,
      error: verifyData.error || `Verify failed (${verifyRes.status})`,
    };
  }

  if (verifyData.mfaRequired) {
    return { success: false, mfaRequired: true, error: 'MFA not supported in MVP yet' };
  }

  // 4. Persist — NEVER use AsyncStorage/localStorage for keys
  const session: Session = { did, token: verifyData.token ?? '' };
  await SecureStore.setItemAsync(STORAGE_KEY_PRIVATE, privHex);
  await SecureStore.setItemAsync(STORAGE_KEY_SESSION, JSON.stringify(session));

  return { success: true, did };
}

/** Check if a session exists in secure storage. */
export async function hasSession(): Promise<boolean> {
  const priv = await SecureStore.getItemAsync(STORAGE_KEY_PRIVATE);
  const sess = await SecureStore.getItemAsync(STORAGE_KEY_SESSION);
  return priv !== null && sess !== null;
}

/** Load the current session from secure storage. */
export async function loadSession(): Promise<Session | null> {
  const sessJson = await SecureStore.getItemAsync(STORAGE_KEY_SESSION);
  if (!sessJson) return null;
  try {
    return JSON.parse(sessJson) as Session;
  } catch {
    return null;
  }
}

/** Clear session and private key from secure storage. */
export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY_PRIVATE);
  await SecureStore.deleteItemAsync(STORAGE_KEY_SESSION);
}
