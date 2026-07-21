/**
 * Typed cards — the closed vocabulary the agent may ask the shell to render.
 *
 * jin#1 (DECISION ruled, 2026-10-06): typed cards, never freeform HTML. The
 * agent sends a typed payload; trusted code renders it. Nothing the agent
 * writes runs as code. The rendered card is a pure function of the signed
 * payload, so "what you approved = what the server asked" holds (jin#4).
 *
 * This file is the APP side of that seam. The kernel side is
 * `apps/kernel/src/lib/decisions/schema.ts` (DecisionCard v1,
 * ima-jin/imajin-ai#2315) — the shapes here mirror the fields the shell
 * needs to render, so app and kernel agree on the first card before any
 * renderer exists. Keep this file additive: a new card is a new member of
 * the union, never a loosening of an existing one.
 *
 * @see docs/vision/agentic-dashboard.md §3
 */

/**
 * Which agent level produced a card (jin#1 DECISION ruled). Custody is
 * disclosed per level; the badge is the only place the architecture
 * leaks into the UI.
 *
 * - L0 — no agent: fixed flows on signed rails
 * - L1 — kernel inference bridge (`imajin_infer`)
 * - L2 — hosted agent (OpenClaw or Warp) via plugin + MCP
 * - L3 — bring-your-own / foreign agent holding its own DID
 */
export type AgentLevel = 'L0' | 'L1' | 'L2' | 'L3';

/** The closed list. Adding a kind here is a schema change (jin#4 versioning). */
export type CardKind = 'decision' | 'confirm';

/** Kinds the vision names but the kit does not carry yet. Reserved, not renderable. */
export const RESERVED_CARD_KINDS = ['ticket', 'payment', 'form'] as const;

/** Mirrors `DecisionCardSubjectKind` on the kernel. */
export type DecisionSubjectKind = 'pr' | 'issue' | 'run' | 'release' | 'config';

export interface DecisionSubject {
  kind: DecisionSubjectKind;
  ref: string;
  url: string;
}

export interface DecisionOption {
  letter: string;
  label: string;
  consequence: string;
}

export interface DecisionRec {
  letter: string;
  why: string;
}

/**
 * `DECISION · <subject> · <question> · options a/b/c · rec: <letter> — <why>`
 * as a payload. Field names match the kernel's DecisionCard v1 so a card
 * read from `GET /jin/api/operator-approvals` renders without translation.
 */
export interface DecisionCard {
  kind: 'decision';
  id: string;
  createdAt: string;
  /** sha256 over the kernel's hashed fields — what the countersign binds to. */
  contentHash: string;
  level: AgentLevel;
  subject: DecisionSubject;
  question: string;
  options: DecisionOption[];
  rec: DecisionRec;
}

/**
 * The jin#2 pending-action card: `No / Yes / 5m / 24h`, Yes focused.
 * `executes` is the one-line statement of what runs on yes — the human
 * approves the statement, the kernel enforces it (jin#1 DECISION ruled).
 */
export interface ConfirmCard {
  kind: 'confirm';
  id: string;
  createdAt: string;
  contentHash: string;
  level: AgentLevel;
  /** The wish, in the requester's words. */
  wish: string;
  /** DID of the agent or principal that raised it. */
  requester: string;
  /** Scope the action needs, in loop vocabulary (e.g. `media:share`). */
  scope: string;
  /** What executes on yes. */
  executes: string;
}

export type Card = DecisionCard | ConfirmCard;

/** The four answers a confirm card accepts (jin#2). */
export type ConfirmAnswer = 'no' | 'yes' | 'defer-5m' | 'defer-24h';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * A deferral is a signed TTL on the proposal, not a snooze on a notification
 * (vision §3). `null` means the answer is final and carries no TTL.
 */
export function deferralTtlMs(answer: ConfirmAnswer): number | null {
  if (answer === 'defer-5m') return 5 * MINUTE_MS;
  if (answer === 'defer-24h') return 24 * HOUR_MS;
  return null;
}

export function isDecisionCard(card: Card): card is DecisionCard {
  return card.kind === 'decision';
}

export function isConfirmCard(card: Card): card is ConfirmCard {
  return card.kind === 'confirm';
}

/**
 * The one line a card renders as in the RECORD lane. Kept here, not in the
 * renderer, so the record line is a function of the payload alone.
 */
export function cardHeadline(card: Card): string {
  if (isDecisionCard(card)) {
    return `DECISION · ${card.subject.ref} · ${card.question}`;
  }
  return `${card.wish} · ${card.scope}`;
}
