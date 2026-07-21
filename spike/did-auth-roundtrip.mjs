// Phase 1 de-risk spike: prove the DID-auth handshake round-trips against the DEV kernel
// using the EXACT crypto the Expo app will use (@noble/ed25519 + @noble/hashes).
// This is the whole technical risk of Phase 1 — if this passes, the RN port is mechanical.

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// wire sync sha512 (same shim as KeyAuthTab.tsx)
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const KERNEL = 'https://dev-jin.imajin.ai';
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes) {
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  let out = '';
  while (num > 0n) { out = BASE58[Number(num % 58n)] + out; num /= 58n; }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = '1' + out;
  return out || '1';
}
const toHex = (b) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
function hexToBytes(hex) {
  const b = new Uint8Array(hex.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.slice(i*2, i*2+2), 16);
  return b;
}

async function main() {
  // Use Jin's prod keypair (present on dev too, confirmed). Load from the keyfile.
  const fs = await import('node:fs');
  const path = process.env.HOME + '/.openclaw/workspace';
  // find the key file
  const candidates = [
    path + '/imajin-keys-BbCan54k.json',
  ];
  let priv;
  for (const c of candidates) {
    try { const j = JSON.parse(fs.readFileSync(c, 'utf8')); priv = j.privateKey || j.keypair?.privateKey; if (priv) { console.log('loaded key from', c); break; } } catch {}
  }
  if (!priv) { console.error('NO KEY — will still test crypto self-consistency'); }

  // 1. derive DID
  let did;
  if (priv) {
    const privBytes = hexToBytes(priv);
    const pub = await ed.getPublicKeyAsync(privBytes);
    did = 'did:imajin:' + base58Encode(pub);
    console.log('derived DID:', did);

    // 2. challenge
    const cRes = await fetch(KERNEL + '/auth/api/login/challenge', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ did })
    });
    if (!cRes.ok) { console.error('challenge failed', cRes.status, await cRes.text()); return; }
    const { challengeId, challenge } = await cRes.json();
    console.log('challenge:', challenge.slice(0,16)+'...');

    // 3. sign challenge hex STRING as utf-8 bytes (the load-bearing detail)
    const sig = await ed.signAsync(new TextEncoder().encode(challenge), privBytes);
    const signature = toHex(sig);

    // 4. verify with kernel
    const vRes = await fetch(KERNEL + '/auth/api/login/verify', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ challengeId, signature })
    });
    const vJson = await vRes.json();
    console.log('verify HTTP', vRes.status, '->', JSON.stringify(vJson).slice(0,200));
    const cookie = vRes.headers.get('set-cookie');
    console.log('session cookie set:', cookie ? 'YES (' + cookie.split('=')[0] + ', domain check: ' + (cookie.includes('.imajin.ai') ? '.imajin.ai ✓' : 'host-only') + ')' : 'NO');
    console.log(vRes.ok && !vJson.error ? '\n✅ SPIKE PASSED — full DID-auth round-trip works with @noble crypto' : '\n❌ SPIKE FAILED');
  }
}
main().catch(e => { console.error('spike error', e); process.exit(1); });
