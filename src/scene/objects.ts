/**
 * Object model — the session is a space of objects, not a screen.
 *
 * This is the shell/domain seam (jin#4). A vertical forks `jin` and plugs
 * its intent vocabulary into the composition layer; the shell does the
 * universal work (capture gesture → infer → present at the right consent
 * tier → resolve → sign). The object type is dimension-agnostic: a 2D/3D
 * spatial renderer is a future view over the same objects, not a redesign.
 *
 * Carried from PR #6 (`src/types/object.ts`). What changed: `composition`
 * is no longer `unknown` — it is a typed card from the closed kit
 * (`./cards`), per jin#1's "typed cards, never freeform" ruling.
 *
 * @see docs/vision/agentic-dashboard.md §2, §4
 */

import type { Card } from './cards';

/**
 * What the presence glyph is telling you (vision §2a–2b). The glyph is a
 * status, not a splash: idle = nothing pending, nothing running.
 */
export type PresenceState = 'idle' | 'thinking' | 'running' | 'waiting';

/**
 * Object kinds the shell knows how to show.
 *
 * - presence — the agent itself; exactly one per session
 * - now      — something the agent is doing (an inference in flight, a run)
 * - needs-you — a typed card waiting on the human's countersign
 * - record   — something the agent did, joined to the card that authorized it
 */
export type ObjKind = 'presence' | 'now' | 'needs-you' | 'record';

export interface Obj {
  /** Stable identifier within the session */
  id: string;

  /** Semantic kind — drives which lane the shell places it in */
  kind: ObjKind;

  /** Visual glyph / ambient identifier (emoji, icon name, or abstract token) */
  glyph: string;

  /**
   * The typed card to compose when this object is active. `null` means the
   * object is idle / ambient (a row, not a card).
   *
   * In a vertical fork, this is where the domain-specific payload lands —
   * still a member of the closed kit, never freeform.
   */
  composition: Card | null;
}

export interface PresenceObj extends Obj {
  kind: 'presence';
  state: PresenceState;
}

export const PRESENCE_ID = 'presence-jin';

const PRESENCE_LABELS: Readonly<Record<PresenceState, string>> = {
  idle: 'Jin is here.',
  thinking: 'Jin is thinking.',
  running: 'Jin is working.',
  waiting: 'Jin needs you.',
};

/** The one line under the glyph, as a function of state. */
export function presenceLabel(state: PresenceState): string {
  return PRESENCE_LABELS[state];
}

/**
 * Return the objects currently active in the session.
 *
 * Phase 1 returns only the presence object, idle. The agent backend that
 * fills NOW / NEEDS YOU / RECORD is jin#2 (confirm rail) and the Runs /
 * Record projections already shipped kernel-side (ima-jin/imajin-ai#2404,
 * #2289). This stub is the mount point, kept honest: it returns what the
 * shell can actually show today.
 */
export function listActiveObjects(): Obj[] {
  const presence: PresenceObj = {
    id: PRESENCE_ID,
    kind: 'presence',
    glyph: 'orb',
    composition: null,
    state: 'idle',
  };
  return [presence];
}

export function findPresence(objects: readonly Obj[]): PresenceObj | undefined {
  return objects.find((o): o is PresenceObj => o.kind === 'presence');
}
