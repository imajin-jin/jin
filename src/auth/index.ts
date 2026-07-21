/**
 * Auth module — DID challenge-response login.
 *
 * The handshake is the kernel's own (`apps/kernel/app/auth/api/login/*`):
 *   1. POST /auth/api/login/challenge { did } → { challengeId, challenge }
 *   2. sign the challenge HEX STRING as UTF-8 bytes (NOT decoded hex)
 *   3. POST /auth/api/login/verify { challengeId, signature } → session cookie
 *
 * Step 2 is the load-bearing detail; `src/auth/__tests__/crypto.test.ts`
 * pins it. The kernel sets an httpOnly cookie and returns the identity
 * summary; there is no bearer token to store, so the session here is the
 * identity summary plus when it was established.
 */

import * as SecureStore from 'expo-secure-store';
import { KERNEL_URL } from '../config';
import { deriveDidFromPrivateKey, signChallenge } from './crypto';

const STORAGE_KEY_PRIVATE = 'jin_private_key';
const STORAGE_KEY_SESSION = 'jin_session';

const PRIVATE_KEY_HEX = /^[0-9a-fA-F]{64}$/;

export interface LoginResult {
  success: boolean;
  did?: string;
  error?: string;
  mfaRequired?: boolean;
}

/** What the kernel returns from `verify` on success. */
export interface Session {
  did: string;
  handle?: string;
  scope?: string;
  subtype?: string;
  name?: string;
  /** ISO timestamp of the verified login. */
  authedAt: string;
}

interface ChallengeResponse {
  challengeId: string;
  challenge: string;
}

interface VerifyResponse {
  did?: string;
  handle?: string;
  scope?: string;
  subtype?: string;
  name?: string;
  error?: string;
  mfaRequired?: boolean;
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${KERNEL_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Perform DID challenge-response login and persist the key + session to
 * SecureStore (never AsyncStorage / localStorage).
 */
export async function login(privHex: string): Promise<LoginResult> {
  if (!PRIVATE_KEY_HEX.test(privHex)) {
    return { success: false, error: 'Invalid private key format. Must be 64 hex characters.' };
  }

  const did = await deriveDidFromPrivateKey(privHex);

  const challengeRes = await postJson('/auth/api/login/challenge', { did });
  if (!challengeRes.ok) {
    const errText = await challengeRes.text().catch(() => 'Unknown error');
    return { success: false, error: `Challenge failed (${challengeRes.status}): ${errText}` };
  }
  const { challengeId, challenge } = (await challengeRes.json()) as ChallengeResponse;

  const signature = await signChallenge(privHex, challenge);

  const verifyRes = await postJson('/auth/api/login/verify', { challengeId, signature });
  const verifyData = (await verifyRes.json().catch(() => ({}))) as VerifyResponse;

  if (!verifyRes.ok) {
    return { success: false, error: verifyData.error ?? `Verify failed (${verifyRes.status})` };
  }
  if (verifyData.mfaRequired) {
    return { success: false, mfaRequired: true, error: 'MFA is not supported in this build yet.' };
  }

  const session: Session = {
    did: verifyData.did ?? did,
    handle: verifyData.handle,
    scope: verifyData.scope,
    subtype: verifyData.subtype,
    name: verifyData.name,
    authedAt: new Date().toISOString(),
  };
  await SecureStore.setItemAsync(STORAGE_KEY_PRIVATE, privHex);
  await SecureStore.setItemAsync(STORAGE_KEY_SESSION, JSON.stringify(session));

  return { success: true, did: session.did };
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
