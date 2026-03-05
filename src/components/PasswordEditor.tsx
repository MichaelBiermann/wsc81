"use client";

import { useState } from "react";

interface Props {
  labels: {
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    save: string;
    cancel: string;
    saved: string;
    wrongPassword: string;
    mismatch: string;
    tooShort: string;
    error: string;
  };
}

export default function PasswordEditor({ labels }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (form.newPassword.length < 8) { setError(labels.tooShort); return; }
    if (form.newPassword !== form.confirmPassword) { setError(labels.mismatch); return; }

    setSaving(true);
    const res = await fetch("/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    setSaving(false);

    if (res.ok) {
      setSuccess(true);
      setOpen(false);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error === "wrong_password" ? labels.wrongPassword : labels.error);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setError("");
  };

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen(true)} className="text-sm text-[#4577ac] hover:underline">
          {labels.changePassword}
        </button>
        {success && <span className="text-sm text-green-600">{labels.saved}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-1">
      <div>
        <label className="block text-xs text-gray-500 mb-1">{labels.currentPassword}</label>
        <input
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{labels.newPassword}</label>
        <input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">{labels.confirmPassword}</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 text-sm text-white bg-[#4577ac] hover:bg-[#3a6699] disabled:opacity-50 rounded transition-colors"
        >
          {saving ? "…" : labels.save}
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          {labels.cancel}
        </button>
      </div>
    </div>
  );
}
