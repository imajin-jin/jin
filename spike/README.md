# spike/ — de-risk artifacts (reference, not app code)

## did-auth-roundtrip.mjs
Phase 1 de-risk spike (jin#1). Proves the DID-auth handshake round-trips against the
DEV kernel using the exact crypto the Expo app uses (`@noble/ed25519` + `@noble/hashes`).

**Result: PASSED** — challenge → sign(challenge-hex-as-UTF-8) → verify → HTTP 200 +
session cookie scoped `.imajin.ai`. The auth path has no unknowns; the RN port is mechanical.

Run: `cd spike && npm i @noble/ed25519@2 @noble/hashes@1 && node did-auth-roundtrip.mjs`
(requires an imajin keypair JSON; the committed version reads Jin's — do not commit real keys).

The load-bearing detail: **sign the challenge HEX STRING as UTF-8 bytes**
(`new TextEncoder().encode(challenge)`), NOT decoded hex bytes. Server `verifySignature`
does `TextEncoder().encode(message)`.
