/**
 * Object model — the scene is a space of objects, not a screen.
 *
 * This is the shell/domain seam. A vertical forks `jin` and plugs its
 * intent vocabulary into the composition layer. The object type is
 * dimension-agnostic: a 2D/3D spatial renderer is a future view over
 * the same objects, not a redesign.
 *
 * @see docs/DEFINITION-OF-DONE.md Phase 1 — "Shell/domain seam documented"
 */
export type ObjKind = 'presence' | 'dialogue' | 'config' | 'app-state';

export interface Obj {
  /** Stable identifier within the session */
  id: string;

  /** Semantic kind — drives how the shell renders and composes */
  kind: ObjKind;

  /** Visual glyph / ambient identifier (emoji, icon name, or abstract token) */
  glyph: string;

  /**
   * Server-composed surface description when this object is active.
   * `null` means the object is idle / ambient (no composition surfaced).
   *
   * In a vertical fork, this is where the domain-specific SDUI payload
   * lands — a closed vocabulary the shell knows how to render.
   */
  composition: null | unknown;
}

/**
 * Return the list of objects currently active in the session.
 *
 * Stub — Phase 1 MVP returns only the presence object.
 * In Phase 2+ this queries the agent backend (jin#2) and surfaces
 * ongoing concerns (chat, tasks, media) as objects the LLM can
 * reference conversationally.
 */
export function listActiveObjects(): Obj[] {
  return [
    {
      id: 'presence-jin',
      kind: 'presence',
      glyph: 'orb',
      composition: null,
    },
  ];
}
