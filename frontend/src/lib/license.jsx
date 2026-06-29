import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { verifyLicense, getConfig } from "./api.js";

// Holds the user's license key (persisted) and the verified Pro state.
const LicenseContext = createContext(null);
const KEY = "brc:license";

export function LicenseProvider({ children }) {
  const [key, setKeyState] = useState(() => localStorage.getItem(KEY) || "");
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

  const clear = useCallback(() => saveKey(""), [saveKey]);

  // Validate a key without saving (returns the verify result).
  const tryKey = useCallback(async (k) => {
    const r = await verifyLicense(k);
    if (r.valid && r.tier === "pro") saveKey(k);
    return r;
  }, [saveKey]);

  const openUnlock = useCallback(() => setUnlockOpen(true), []);
  const closeUnlock = useCallback(() => setUnlockOpen(false), []);

  return (
    <LicenseContext.Provider
      value={{
        key, isPro, checking, config, saveKey, clear, tryKey,
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
