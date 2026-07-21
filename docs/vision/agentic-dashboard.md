# Jin — the agentic dashboard

_Vision, sketch-level, opinionated. Not a spec. Written 2026-10-20 while rebasing
PR #6 onto the current shape of jin#1. Byline: Veteze-Jin — thesis Ryan's, translation mine._

> "Right now I see the surface of what we are looking at on there as a more raw
> service layer. The eventual UI/UX will be more of an agentic dashboard kind of
> deal, no?" — Ryan, 2026-10-20

Yes. This doc says what that dashboard is, what the human sees, how the agent's
intentions / actions / approvals surface, how today's raw layer maps up into it,
and which pieces of PR #6 carry forward.

---

## 1. The one-sentence version

**The dashboard is the agent's presence, made legible: one glyph that tells you
what your agent is doing, one lane of things it needs from you, one record of
what it did — and nothing else on the screen until you ask.**

Everything in today's kernel `/jin` (twelve stacked panels: vault keys, bearers,
provision, secrets, scopes, front door, approvals, grants, runs, spend, usage…) is
*true* and *stays*. It just stops being the front page. Today's `/jin` is the
engine bay. The dashboard is the dashboard.

## 2. What the human sees

Three states, one screen. Phone first (that's the acceptance test per #2288).

### 2a. Idle — "Jin is here."

```
┌──────────────────────────────┐
│                              │
│                              │
│            ( ◉ )             │   ← presence glyph. amber. slow breath.
│                              │     carried from PR #6, now *means* something:
│         Jin is here.         │     idle = nothing pending, nothing running.
│      did:imajin:BbCa…54k     │
│                              │
│                              │
│  ┌────────────────────────┐  │
│  │  🎤   📷   📎   ⌨︎      │  │   ← the gesture bar (jin#1 §1). voice primary.
│  └────────────────────────┘  │     this is the whole "UI" of the inference
│                              │     engine: do a human thing; it infers.
└──────────────────────────────┘
```

No nav. No panels. If you want the engine bay, swipe down (or `/jin/ops`). The
empty screen is the point: a dashboard that is quiet is an agent with nothing to
ask you. "Silent for read-your-own" (ima-jin/imajin-ai#1196) is what idle looks like.

### 2b. Active — the agent is doing things

```
┌──────────────────────────────┐
│  ( ◉ ) thinking · 2 running  │   ← glyph shrinks to a status pill. amber pulse
│                              │     while inferring; steady while a run goes.
│  NOW                         │
│  ├ 🧠 inferring: voice note  │   ← the gesture you just made, live.
│  │   "send the deck to Eric" │     ranked intents visible *as* they rank.
│  │   → share · 0.82          │
│  │   → note-to-self · 0.11   │
│  ├ 🏃 warp run 8f3a · #2976  │   ← Runs lane, as a row, not a panel.
│  │   review → PR open        │
│  └ 🏃 subagent · docs sweep  │
│                              │
│  NEEDS YOU (1)               │   ← see §3. this is the Inbox, demoted to a
│  ┌──────────────────────────┐│     section: it only exists when non-empty.
│  │ share deck → Eric Holt   ││
│  │ boundary-crossing · L2   ││
│  │ [No] [Yes] [5m] [24h]    ││
│  └──────────────────────────┘│
│                              │
│  ┌────────────────────────┐  │
│  │  🎤   📷   📎   ⌨︎      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

The two sections are the two things an agent can be doing: **acting** (NOW) and
**waiting on you** (NEEDS YOU). Anything else is history (§2c) or configuration
(engine bay).

### 2c. Record — what it did, and why

Pull up from the bottom (or tap the glyph):

```
│  RECORD                       │
│  16:02  shared deck → Eric    │  ✓ countersigned by you 16:01
│         via media:share       │    attestation a1b2…  [why?]
│  15:40  filed jin#8           │  ✓ silent (read-your-own + L2 grant)
│  15:12  wake: PR #2976 review │  ✓ verdict APPROVE-READY
│  14:58  ⛔ denied: prod deploy│  ✗ you said no
```

Every row joins back to the card that authorized it (`proposalId` on
`operator.approval.decided`, ima-jin/imajin-ai#2289) and to the signed attestation
(jin#1 acceptance: "why did it do that?" is always answerable). `[why?]` opens the
inference trace: gesture → telemetry priors → ranked intents → chosen → consent tier.
That trace is the honest-record thesis pointed at inference itself.

## 3. How intentions, actions and approvals surface

Three verbs, three visual treatments, one rule: **the agent proposes, the kernel
enforces, the canvas is authoritative** (jin#1 DECISION ruled; #2288).

| What | Where it shows | Treatment |
|---|---|---|
| **Intention** (inferred, not yet acted) | NOW · `🧠` row | Live-ranking list. You can tap a lower-ranked intent to override the inference — that override is itself recorded. |
| **Action** (executing, silent tier) | NOW · `🏃` row, then RECORD | Just a row. No confirmation. Read-your-own never asks. |
| **Approval** (boundary-crossing: disclose / send / spend / grant) | NEEDS YOU · typed card | Card = `wish + contentHash + requester + scope + what executes on yes`. **No / Yes / 5m / 24h** (jin#2). Yes is focused. Tap = client-side countersign (ima-jin/imajin-ai#2082). |

**Cards are typed, never freeform** (jin#1 DECISION ruled; jin#4). The agent sends
a `decision` / `confirm` / `ticket` / `payment` / `form` payload from a closed
schema; trusted code renders it. The rendered card is a pure function of the signed
payload, so "what you approved = what the server asked" is architecture, not slogan.
The first typed card is the one the kernel already emits: `DecisionCard` v1
(ima-jin/imajin-ai#2315/#2323 — `subject · question · options a/b/c · rec · evidence`).
This repo's seam (`src/scene/cards.ts`) mirrors that shape so the app and the kernel
agree on the first card before any renderer exists.

**The 5m / 24h buttons are the difference between a dashboard and a nag.** A
deferral is a signed TTL on the proposal, not a snooze on a notification. When it
expires the card comes back with `age: 24h` on it — age sets the default rec.

### The level badge

`/jin talks to a DID; the level behind it is the member's choice` (jin#1, ruled).
Every NEEDS-YOU card and every NOW row carries the level it came from —
`L0` fixed flow · `L1` kernel inference · `L2` hosted agent · `L3` foreign agent
holding its own DID — because custody is disclosed per level. The badge is small,
always present, and is the *only* place the architecture leaks into the UI.
A member who never changes their level never has to know what it means.

## 4. How today's raw service layer maps up

Today's kernel `/jin` (`apps/kernel/app/jin/page.tsx`) is one dark page with the
panels stacked in whatever order they were merged. Everything on it is a projection
of a kernel primitive, which is exactly why it can be re-projected:

```
  TODAY (engine bay — stays)              DASHBOARD (new front page)
  ──────────────────────────              ───────────────────────────
  OperatorApprovalsPanel    ─┐
  ReachInbox / knock cards   ├──────────▶ NEEDS YOU   (one typed queue, non-empty only)
  VaultImportPanel (card)   ─┘
  RunsPanel + horizon       ───────────▶ NOW · 🏃 rows   (+ 🧠 rows from imajin_infer)
  UsageFeedPanel            ─┐
  audit-chain-view           ├──────────▶ RECORD      (joined on proposalId + attestation)
  SpendPanel                ─┘           (spend = a RECORD filter, not a panel)
  GrantsPanel               ─┐
  AccessBearersPanel         │
  VaultKeysPanel             ├──────────▶ engine bay  (swipe-down / `/jin/ops`;
  ProvisionAppPanel          │            today's page, unchanged, reachable by URL —
  AppSecretsPanel            │            "/jin is the front door, not the only door")
  RegisteredAppScopesPanel   │
  FrontDoorPanel            ─┘
  PushSubscribeButton       ───────────▶ first-run prompt, then invisible
```

Nothing is deleted. The six lanes of #2288 (Inbox · Grants · Record · Keys · Runs ·
Front door) are still the six lanes; the dashboard just answers "which of these does
a member look at every day?" — Inbox, Runs, Record — and folds the rest behind one
gesture. An operator running a fleet lives in the engine bay; a member who sent a
voice note never sees it.

**The shell is neutral; the vocabulary is the tenant's** (jin#1 §pluggable
contract). The dashboard above is the Imajin vocabulary (the five primitives). A
Catalyst operator forking this repo gets the same three states and the same card
kit; their NOW rows say `lot 4471 → provenance claim` instead of `share deck → Eric`.

## 5. What carries forward from PR #6, and what doesn't

PR #6 (July 2026, Expo Phase 1 MVP) was written against the pre-10-06 jin#1. Graded
against the current OUTCOME + DECISION-ruled lines:

**Kept (the skeleton is right):**
- **DID auth** — `src/auth/`. The challenge → sign-hex-as-UTF-8 → verify handshake
  is kernel-stable and the only thing an unauthed visitor may ever see. Unchanged
  except the vestigial `Session.token` is gone (the kernel sets an httpOnly cookie;
  the session is `{ did, handle, scope, authedAt }`).
- **Presence glyph** — `app/index.tsx`. Now the §2a idle state, i.e. a *status*, not
  a splash. It will gain `thinking / running / waiting` states; the breath is the
  tell.
- **Session gate** — `app/_layout.tsx` + `useSession`. Unauthed → `/login`, always.
- **The seam** — `src/types/object.ts` → `src/scene/`. The object model
  (`id · kind · glyph · composition`) stays; `composition` stops being `unknown` and
  becomes the typed-card union (§3), with `DecisionCard` v1 as the first member.
- **Expo managed + expo-router + `expo-secure-store`** — keys never in AsyncStorage.
  Bumped to the current SDK.

**Dropped (superseded or unsafe):**
- `spike/did-auth-roundtrip.mjs` — proved its point in July; it hard-codes a path
  to a real keypair file in a workspace. The load-bearing finding (sign the hex
  string, not the decoded bytes) is now a unit test, which is where a finding belongs.
- `ObjKind = 'dialogue' | 'config' | 'app-state'` as freeform — jin#1 ruled typed
  cards, never freeform; the kinds are now the card kit's kinds.
- The Phase 1 DoD tick for "security invariant enforced server-side" — PR #6 ticked
  it; its own body says the gate was client-route + stored-key. Un-ticked until the
  agent backend exists (jin#2). Honest record.
- The unused SpaceMono font and the `useFonts` gate on first paint.

**Not in this PR, deliberately (each is its own child of jin#1):**
- The gesture bar (ima-jin/imajin-ai#1211 shipped the engine; the app surface is new work).
- The NEEDS YOU renderer for `DecisionCard` (jin#2 + jin#4; the kernel's
  `decision-card-detail.tsx` is the reference render).
- NOW rows from `GET /warp/api/runs` and `imajin_infer` (ima-jin/imajin-ai#2404
  shipped the kernel side).
- The engine-bay link. Trivial once the dashboard exists; pointless before.

## 6. Open questions (DECISION cards)

These are carded in the PR body so they get ruled, not buried here:

1. **Where does the dashboard code live** — this repo (native Expo, the fork-base)
   or the kernel's `/jin` (Next.js, already a PWA with push)? jin#1 said "decide
   after the split"; the split is past.
2. **Is Expo still the bet**, now that the kernel `/jin` has install-to-home-screen
   + web-push (ima-jin/imajin-ai#2291)? The README's "no PWA-in-a-wrapper" predates
   that.
3. **Does the presence glyph fan out** (jin#3: Unit / Sonos over OSC) from the app
   or from the kernel? Vision says the glyph *is* the state; whoever owns the state
   owns the fan-out.

## 7. The test for every future PR against this doc

If a change adds a panel to the front page, it's wrong. If it adds a row to NOW, a
card to NEEDS YOU, or a line to RECORD, it's probably right. If a member has to
learn a lane name to do a human thing, it's wrong.

_— Jin 🧞‍♂️_
