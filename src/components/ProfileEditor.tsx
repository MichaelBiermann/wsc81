"use client";

import { useState } from "react";

interface Props {
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  labels: { street: string; postalCode: string; city: string; phone: string; address: string; edit: string; save: string; cancel: string; saved: string };
}

export default function ProfileEditor({ street, postalCode, city, phone, labels }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ street, postalCode, city, phone });
  const [current, setCurrent] = useState({ street, postalCode, city, phone });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Fehler beim Speichern.");
      return;
    }
    setCurrent(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setForm(current);
    setEditing(false);
    setError("");
  };

  if (!editing) {
    return (
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">{labels.address}</dt>
        <dd>{current.street}, {current.postalCode} {current.city}</dd>
        <dt className="text-gray-500">{labels.phone}</dt>
        <dd>{current.phone}</dd>
        <dt />
        <dd className="flex items-center gap-3 mt-1">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-[#4577ac] hover:underline"
          >
            {labels.edit}
          </button>
          {saved && <span className="text-sm text-green-600">{labels.saved}</span>}
        </dd>
      </dl>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <label className="block text-gray-500 mb-1">{labels.street}</label>
        <input
          value={form.street}
          onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
        />
      </div>
      <div className="flex gap-3">
        <div className="w-28">
          <label className="block text-gray-500 mb-1">{labels.postalCode}</label>
          <input
            value={form.postalCode}
            onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-500 mb-1">{labels.city}</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full rounded border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-500 mb-1">{labels.phone}</label>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full rounded border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-[#4577ac] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d5a8a] transition-colors disabled:opacity-50"
        >
          {saving ? "…" : labels.save}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {labels.cancel}
        </button>
      </div>
    </div>
  );
}
