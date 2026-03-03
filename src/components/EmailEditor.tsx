"use client";

import { useState } from "react";

type Labels = {
  edit: string;
  newEmail: string;
  save: string;
  cancel: string;
  cancelPending: string;
  pendingBanner: string;
  sent: string;
  emailTaken: string;
  error: string;
};

export default function EmailEditor({
  email,
  pendingEmail,
  labels,
}: {
  email: string;
  pendingEmail: string | null;
  labels: Labels;
}) {
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pending, setPending] = useState(pendingEmail);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      if (res.ok) {
        setPending(newEmail);
        setSentTo(newEmail);
        setEditing(false);
        setNewEmail("");
      } else {
        const data = await res.json();
        if (data.error === "EMAIL_TAKEN") {
          setError(labels.emailTaken);
        } else {
          setError(labels.error);
        }
      }
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelPending() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/email", { method: "DELETE" });
      if (res.ok) {
        setPending(null);
        setSentTo(null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2">
      {/* Current email row */}
      <div className="flex items-center gap-2">
        <span className="text-sm">{email}</span>
        {!editing && !pending && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-[#4577ac] hover:underline"
          >
            {labels.edit}
          </button>
        )}
      </div>

      {/* Pending banner */}
      {pending && !sentTo && (
        <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800 flex items-center justify-between gap-3">
          <span>{labels.pendingBanner.replace("{email}", pending)}</span>
          <button
            type="button"
            onClick={handleCancelPending}
            disabled={loading}
            className="shrink-0 text-yellow-700 underline hover:text-yellow-900 disabled:opacity-50"
          >
            {labels.cancelPending}
          </button>
        </div>
      )}

      {/* Sent success banner */}
      {sentTo && (
        <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800 flex items-center justify-between gap-3">
          <span>{labels.sent.replace("{email}", sentTo)}</span>
          <button
            type="button"
            onClick={handleCancelPending}
            disabled={loading}
            className="shrink-0 text-yellow-700 underline hover:text-yellow-900 disabled:opacity-50"
          >
            {labels.cancelPending}
          </button>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="mt-2 flex flex-col gap-2">
          <label className="text-sm text-gray-600">{labels.newEmail}</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !newEmail}
              className="rounded bg-[#4577ac] px-3 py-1.5 text-sm text-white hover:bg-[#3a6699] disabled:opacity-50"
            >
              {loading ? "…" : labels.save}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(null); setNewEmail(""); }}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
