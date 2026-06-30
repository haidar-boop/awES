import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { saveAnalysis } from "../lib/saved.js";

// Save the current report to the signed-in user's history. Saving requires an
// account; if signed out, we open the auth modal instead.
export default function SaveButton({ analysis }) {
  const { client, isAuthed, openUnlock } = useAuth();
  const [state, setState] = useState("idle"); // idle | saving | saved | error

  async function onSave() {
    if (!isAuthed || !client) {
      openUnlock();
      return;
    }
    setState("saving");
    const name = `${analysis.verdict.headline} · ${analysis.meta?.n_observations ?? "?"} obs`;
    const { error } = await saveAnalysis(client, name, analysis);
    setState(error ? "error" : "saved");
    setTimeout(() => setState("idle"), 2500);
  }

  const label = { idle: "Save", saving: "…", saved: "Saved", error: "Try again" }[state];
  return (
    <button
      className="btn-ghost"
      onClick={onSave}
      disabled={state === "saving"}
      title={isAuthed ? "Save to your history" : "Sign in to save to your history"}
    >
      {label}
    </button>
  );
}
