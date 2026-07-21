# Jin — the Imajin app shell

**Jin is the presence.** It acts openly and signs what it did. This repo is the canonical/consumer instance of the **Imajin app shell** — the neutral surface a sovereign self authenticates into — and it is the **fork-base every vertical forks** (Artifact, Tripian, Catalyst…) to build its domain-specific app by plugging an intent vocabulary on top of the shell.

> Tracking work-order: [ima-jin/imajin-ai#1374](https://github.com/ima-jin/imajin-ai/issues/1374)

## Namespace note (read this first — avoids the 11pm spiral)

Three things share the word "jin." They are different:

| Name | What it is |
|------|-----------|
| **repo `ima-jin/jin`** | this repo — the app shell (source code) |
| **`jin.imajin.ai`** | where the app deploys (served at root; the Imajin kernel routes — `/auth`, `/media`, `/mcp` — live underneath) |
| **Jin** | the presence you meet inside the app |

`imajin.ai` is the kernel front door / legacy config surface (slowly retired). `jin.imajin.ai` is the app. Log into either → authed on both (shared `/auth`, cookie scoped `Domain=.imajin.ai`).

## Built to be forked (load-bearing)

- **Public from creation.** Imajin builds in the open; a sovereignty/transparency flagship shipping private would contradict the thesis.
- **Fork this to build a vertical.** The shell (auth + presence + the object/composition loop) is domain-agnostic. A vertical forks `jin`, swaps in its intent vocabulary, and ships its own app **without importing Imajin kernel primitives** — client-pattern import only. Jin never imports domain logic; the fork never imports Imajin guts.
- This is the **reference build at the app layer** — a clean fork should stay conformant (ties to the conformance-suite track / two-entity architecture).

## Architecture (see #1374 + sub-issues for the full record)

- **Proper native app — React Native / Expo.** No PWA-in-a-wrapper. Real iOS/Android, native presence.
- **Server-Driven UI (SDUI), owned closed vocabulary.** The server sends a declarative surface description; the native shell renders it. We own the schema because the confirm surface is a **trust boundary** — a closed vocabulary means the rendered surface is a pure function of the signed payload ("what you approved = what the server asked"). Not raw HTML/webview. → [#4](https://github.com/ima-jin/jin/issues/4)
- **The session is a space of objects, not a screen.** Two layers:
  - **Scene** — persistent objects with a glyph/ambient (liveness) state.
  - **Composition** — click an object → the server composes the full surface (player / chat / signed-confirm) from the closed schema.
  - Object model is **dimension-agnostic** (`id`, `kind`, `glyph`, `composition`) — a 2D/3D spatial renderer is a *future* view over the same objects, not designed now.
- **Immediate surfacing method:** a `list_active_objects` tool the LLM queries → ongoing concerns (video playing, chat open, task running) surfaced conversationally. Session-state made legible. Buildable now, no spatial UI.
- **Ambient state → OSC fan-out** to physical surfaces (the Unit, Sonos). Presence/telemetry only, never auth or the signing event. → [#3](https://github.com/ima-jin/jin/issues/3)

> **Roadmap issues (this repo):** [#1](https://github.com/ima-jin/jin/issues/1) Intention Inference epic · [#2](https://github.com/ima-jin/jin/issues/2) /jin dashboard confirm · [#3](https://github.com/ima-jin/jin/issues/3) OSC fan-out · [#4](https://github.com/ima-jin/jin/issues/4) UI schema / object model. Platform/kernel/connector work stays on [imajin-ai](https://github.com/ima-jin/imajin-ai) (#1228, #1366-line, #1373, #1293) — Jin consumes it.
- **Security invariant:** no unauthed LLM on a public surface. Unauthed → static DID-login only; the agent backend connects **only** after a verified session, bound to the DID, `onBehalfOf` that human. Enforced at the route/socket handshake (server-layer, not a client redirect).

## MVP — "prove identity → establish presence"

The honest first thing; the forkable skeleton. No actions, connectors, or gesture yet.

- **DID auth** — existing sovereign login handshake (challenge → sign → verify → session).
- **Idle presence surface** — post-auth, Jin is *there*: the presence glyph (spinning logo), idle. Framed as "the first object in the world" so the scene model is real from commit one.
- **Shell/domain seam documented** — the point where a vertical's intent vocabulary plugs in is a clean, documented interface even in the MVP.

**MVP DoD:** a human authenticates with their DID → lands on a live idle presence surface; the shell/domain seam is a documented interface.

## Apps table

| App | pm2 (prod) | Dev port | Prod port | Path prefix |
|-----|-----------|----------|-----------|-------------|
| jin | prod-jin-app | 3402 | 7402 | `/` on `jin.imajin.ai` (root) |

> Port pair `3402 / 7402` — next free client pair after fixready (3400/7400) and karaoke (3401/7401). See imajin-ai `TOOLS.md`.
> **Note on `prod-jin` vs `prod-jin-app`:** the kernel front-door process is `prod-jin`/`dev-jin` (imajin-ai monorepo). This app's process is named `prod-jin-app`/`dev-jin-app` to avoid the collision.

## Running the Expo app

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example .env.local
# Edit .env.local — set EXPO_PUBLIC_KERNEL_URL if not using the dev default

# Start the dev server
npx expo start
# Or: npm run ios / npm run android / npm run web

# Typecheck
npm run typecheck
```

**Required:** `react-native-get-random-values` is imported at the top of `app/_layout.tsx` to polyfill `getRandomValues` before `@noble/ed25519` is loaded. This is load-bearing — without it, key derivation will throw on native.

## Contributing

Fork-and-PR is the standard (see imajin-ai `AGENTS.md`). Work from your own fork under your own GitHub identity; open PRs into `ima-jin/jin:main`. No feature branches on the org repo.

## License

MIT — see [LICENSE](./LICENSE).
