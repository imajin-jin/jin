/**
 * Crypto helpers for DID auth.
 *
 * Ports the PROVEN recipe from spike/did-auth-roundtrip.mjs:
 * - @noble/ed25519 with sha512 sync shim
 * - base58 encoding for DIDs
 * - hex <-> bytes conversion
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Wire sync sha512 (same shim as KeyAuthTab.tsx reference)
(ed.etc as { sha512Sync?: (...m: Uint8Array[]) => Uint8Array }).sha512Sync = (...m: Uint8Array[]) =>
  sha512(ed.etc.concatBytes(...m));

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function base58Encode(bytes: Uint8Array): string {
  let num = BigInt('0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''));
  let encoded = '';
  while (num > 0n) {
    const remainder = Number(num % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    num = num / 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    encoded = '1' + encoded;
  }
  return encoded || '1';
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function deriveDidFromPrivateKey(privHex: string): Promise<string> {
  const privBytes = hexToBytes(privHex);
  const pubBytes = await ed.getPublicKeyAsync(privBytes);
  const b58 = base58Encode(pubBytes);
  return `did:imajin:${b58}`;
}

export async function signChallenge(privHex: string, challenge: string): Promise<string> {
  const privBytes = hexToBytes(privHex);
  const sigBytes = await ed.signAsync(new TextEncoder().encode(challenge), privBytes);
  return bytesToHex(sigBytes);
}
