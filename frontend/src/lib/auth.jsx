import {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { getConfig, getMe, setAuthToken } from "./api.js";

// Accounts via Supabase: sign-up, email verification, login. The server decides
// Pro (verified account + completed purchase); we just surface that here.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [config, setConfig] = useState({ auth_enabled: false, payments_enabled: false });
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [me, setMe] = useState({ authenticated: false, pro: false });
  const [ready, setReady] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  // Load public config and (if configured) init the Supabase client.
  useEffect(() => {
    let mounted = true;
    getConfig()
      .then((cfg) => {
        if (!mounted) return;
        setConfig(cfg);
        if (cfg.auth_enabled && cfg.supabase_url && cfg.supabase_anon_key) {
          setClient(
            createClient(cfg.supabase_url, cfg.supabase_anon_key, {
              auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
            })
          );
        } else {
          setReady(true);
        }
      })
      .catch(() => mounted && setReady(true));
    return () => {
      mounted = false;
    };
  }, []);

  // Track the Supabase session; push the token to the API client; fetch entitlement.
  useEffect(() => {
    if (!client) return;
    const apply = async (sess) => {
      setSession(sess);
      setAuthToken(sess?.access_token || null);
      if (sess?.access_token) {
        try {
          setMe(await getMe());
        } catch {
          setMe({ authenticated: false, pro: false });
        }
      } else {
        setMe({ authenticated: false, pro: false });
      }
    };
    client.auth.getSession().then(({ data }) => apply(data.session).then(() => setReady(true)));
    const { data: sub } = client.auth.onAuthStateChange((_e, sess) => apply(sess));
    return () => sub?.subscription?.unsubscribe?.();
  }, [client]);

  const refreshMe = useCallback(async () => {
    try {
      const r = await getMe();
      setMe(r);
      return r;
    } catch {
      return { authenticated: false, pro: false };
    }
  }, []);

  // Re-check entitlement when the user returns to the tab (e.g. back from the
  // Stripe checkout tab) so Pro flips without needing a manual refresh.
  useEffect(() => {
    const onFocus = () => {
      if (session?.access_token && !me.pro) refreshMe();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [session, me.pro, refreshMe]);

  const signUp = useCallback(
    async (email, password) =>
      client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      }),
    [client]
  );
  const signIn = useCallback(
    async (email, password) => client.auth.signInWithPassword({ email, password }),
    [client]
  );
  // OAuth (Google / Apple / GitHub). The provider must be enabled in the
  // Supabase dashboard; the browser is redirected out and back, and the
  // returning session is picked up by detectSessionInUrl above.
  const signInWithProvider = useCallback(
    async (provider) =>
      client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      }),
    [client]
  );
  const signOut = useCallback(async () => {
    await client?.auth.signOut();
    setMe({ authenticated: false, pro: false });
  }, [client]);
  const resend = useCallback(
    async (email) => client.auth.resend({ type: "signup", email }),
    [client]
  );

  const openUnlock = useCallback(() => setUnlockOpen(true), []);
  const closeUnlock = useCallback(() => setUnlockOpen(false), []);

  return (
    <AuthContext.Provider
      value={{
        config, client, session, me, ready,
        isAuthed: !!me.authenticated, isVerified: !!me.verified, isPro: !!me.pro,
        email: me.email || session?.user?.email || "",
        signUp, signIn, signInWithProvider, signOut, resend, refreshMe,
        unlockOpen, openUnlock, closeUnlock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
