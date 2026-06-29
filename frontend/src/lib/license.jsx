import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { verifyLicense, getConfig, claimLicense } from "./api.js";

// Holds the user's Pro credential (a key, fetched transparently by email) and
// the verified Pro state. The user only ever types their email.
const LicenseContext = createContext(null);
const KEY = "brc:license";
const EMAIL = "brc:email";

export function LicenseProvider({ children }) {
  const [key, setKeyState] = useState(() => localStorage.getItem(KEY) || "");
  const [email, setEmailState] = useState(() => localStorage.getItem(EMAIL) || "");
  const [isPro, setIsPro] = useState(false);
  const [checking, setChecking] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [config, setConfig] = useState({
    payments_enabled: false,
    checkout_url: "",
    price_label: "Pro",
  });

  // Load public config (checkout link, price label) once.
  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  // Verify the stored key whenever it changes.
  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setIsPro(false);
      return;
    }
    setChecking(true);
    verifyLicense(key)
      .then((r) => {
        if (!cancelled) setIsPro(Boolean(r.valid) && r.tier === "pro");
      })
      .catch(() => !cancelled && setIsPro(false))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const saveKey = useCallback((k) => {
    const v = (k || "").trim();
    setKeyState(v);
    if (v) localStorage.setItem(KEY, v);
    else localStorage.removeItem(KEY);
  }, []);

  const saveEmail = useCallback((e) => {
    const v = (e || "").trim();
    setEmailState(v);
    if (v) localStorage.setItem(EMAIL, v);
    else localStorage.removeItem(EMAIL);
  }, []);

  const clear = useCallback(() => {
    saveKey("");
    setIsPro(false);
  }, [saveKey]);

  // Unlock Pro by email (after payment). Remembers the email, and on success
  // stores the returned key transparently. Throws (404) until the purchase
  // is found, so the caller can poll.
  const claim = useCallback(async (e) => {
    const addr = (e || "").trim();
    saveEmail(addr);
    const r = await claimLicense(addr);
    if (r.key) {
      saveKey(r.key);
      setIsPro(true);
    }
    return r;
  }, [saveKey, saveEmail]);

  const openUnlock = useCallback(() => setUnlockOpen(true), []);
  const closeUnlock = useCallback(() => setUnlockOpen(false), []);

  return (
    <LicenseContext.Provider
      value={{
        key, email, isPro, checking, config, saveKey, saveEmail, clear, claim,
        unlockOpen, openUnlock, closeUnlock,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicense must be used within LicenseProvider");
  return ctx;
}
