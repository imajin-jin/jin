/**
 * Session hook — provides reactive session state for the app shell.
 *
 * The presence surface requires a valid session; unauthed users
 * are always routed to the static login screen.
 */

import { useState, useEffect, useCallback } from 'react';
import { hasSession, logout, loadSession, type Session } from '@/src/auth';

export interface UseSessionReturn {
  /** true while checking secure storage on mount */
  loading: boolean;
  /** true if a session exists */
  authed: boolean;
  /** The loaded session (null if not authed) */
  session: Session | null;
  /** Re-check secure storage (call after login) */
  refresh: () => Promise<void>;
  /** Clear session and private key */
  signOut: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const refresh = useCallback(async () => {
    const ok = await hasSession();
    setAuthed(ok);
    if (ok) {
      const s = await loadSession();
      setSession(s);
    } else {
      setSession(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setAuthed(false);
    setSession(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await refresh();
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [refresh]);

  return { loading, authed, session, refresh, signOut };
}
