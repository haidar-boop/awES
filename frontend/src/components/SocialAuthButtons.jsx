import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 010-3.4V4.97H.96a9 9 0 000 8.06l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 00.96 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11.18 8.49c-.02-1.6 1.3-2.37 1.36-2.41-.74-1.08-1.9-1.23-2.31-1.25-.98-.1-1.92.58-2.42.58-.5 0-1.27-.57-2.09-.55-1.07.02-2.06.63-2.61 1.59-1.11 1.93-.28 4.78.8 6.34.53.76 1.16 1.62 1.98 1.59.8-.03 1.1-.51 2.06-.51.96 0 1.23.51 2.07.5.86-.02 1.4-.78 1.92-1.55.6-.88.85-1.74.86-1.78-.02-.01-1.65-.63-1.68-2.5zM9.6 3.84c.44-.53.74-1.27.66-2.01-.64.03-1.41.43-1.86.96-.41.47-.77 1.22-.67 1.94.71.06 1.43-.36 1.87-.89z" />
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const PROVIDERS = [
  ["google", "Google", GoogleIcon],
  ["apple", "Apple", AppleIcon],
  ["github", "GitHub", GitHubIcon],
];

// Social sign-up / sign-in row. Real Supabase OAuth — each provider must be
// enabled in the Supabase dashboard for the redirect to succeed.
export default function SocialAuthButtons({ onError, verb = "Continue" }) {
  const { signInWithProvider, config, client } = useAuth();
  const [busy, setBusy] = useState(null);
  const disabled = !config.auth_enabled || !client;

  async function go(provider) {
    if (disabled) return;
    setBusy(provider);
    onError?.(null);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        onError?.(error.message);
        setBusy(null);
      }
      // on success the browser redirects to the provider; no further UI needed
    } catch (e) {
      onError?.(e?.message || "Could not start sign-in.");
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2">
      {PROVIDERS.map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => go(id)}
          disabled={disabled || busy}
          className="btn-ghost w-full justify-center gap-2.5"
          title={disabled ? "Accounts aren’t configured on this deployment yet" : `${verb} with ${label}`}
        >
          {busy === id ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-data border-t-transparent" />
          ) : (
            <Icon />
          )}
          <span>{verb} with {label}</span>
        </button>
      ))}
    </div>
  );
}
