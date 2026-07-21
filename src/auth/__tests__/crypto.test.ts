import { describe, expect, it } from 'vitest';
import * as ed from '@noble/ed25519';
import {
  base58Encode,
  bytesToHex,
  deriveDidFromPrivateKey,
  hexToBytes,
  signChallenge,
} from '../crypto';

// A fixed, throwaway test vector — never a real key.
const PRIV_HEX = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';

describe('hex <-> bytes', () => {
  it('round-trips', () => {
    const bytes = hexToBytes(PRIV_HEX);
    expect(bytes).toHaveLength(32);
    expect(bytesToHex(bytes)).toBe(PRIV_HEX);
  });
});

describe('base58Encode', () => {
  it('encodes the Bitcoin alphabet with leading-zero handling', () => {
    expect(base58Encode(new Uint8Array([]))).toBe('1');
    expect(base58Encode(new Uint8Array([0, 0, 1]))).toBe('112');
    expect(base58Encode(new Uint8Array([0xff]))).toBe('5Q');
  });
});

describe('deriveDidFromPrivateKey', () => {
  it('derives did:imajin:<base58(pub)> from the private key', async () => {
    const did = await deriveDidFromPrivateKey(PRIV_HEX);
    const pub = await ed.getPublicKeyAsync(hexToBytes(PRIV_HEX));
    expect(did).toBe(`did:imajin:${base58Encode(pub)}`);
    // RFC 8032 test vector 1 public key, for the record.
    expect(bytesToHex(pub)).toBe('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
  });
});

describe('signChallenge', () => {
  it('signs the challenge HEX STRING as UTF-8 bytes, not the decoded bytes', async () => {
    const challenge = 'deadbeef00112233445566778899aabbccddeeff';
    const sigHex = await signChallenge(PRIV_HEX, challenge);
    const pub = await ed.getPublicKeyAsync(hexToBytes(PRIV_HEX));
    const sig = hexToBytes(sigHex);

    // The kernel verifies over TextEncoder().encode(challenge).
    const overUtf8 = await ed.verifyAsync(sig, new TextEncoder().encode(challenge), pub);
    const overDecoded = await ed.verifyAsync(sig, hexToBytes(challenge), pub);
    expect(overUtf8).toBe(true);
    expect(overDecoded).toBe(false);
  });
});
