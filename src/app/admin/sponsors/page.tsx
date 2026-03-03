"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

interface Sponsor { id: string; name: string; websiteUrl: string; imageUrl: string; displayOrder: number; }

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState({ name: "", websiteUrl: "", imageUrl: "", displayOrder: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/sponsors");
    setSponsors(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", websiteUrl: "", imageUrl: "", displayOrder: String(sponsors.length) }); setShowForm(true); };
  const openEdit = (s: Sponsor) => { setEditing(s); setForm({ name: s.name, websiteUrl: s.websiteUrl, imageUrl: s.imageUrl, displayOrder: String(s.displayOrder) }); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    const body = { ...form, displayOrder: Number(form.displayOrder) };
    const res = editing
      ? await fetch(`/api/admin/sponsors/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/admin/sponsors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setShowForm(false); load(); }
    else setError("Fehler beim Speichern.");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sponsor wirklich löschen?")) return;
    await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sponsoren</h1>
        <Button onClick={openNew}>+ Sponsor hinzufügen</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6 max-w-lg">
          <h2 className="font-semibold text-gray-800 mb-4">{editing ? "Sponsor bearbeiten" : "Neuer Sponsor"}</h2>
          <div className="flex flex-col gap-3">
            <FormField label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField label="Website-URL" required><Input type="url" value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} /></FormField>
            <FormField label="Bild-URL" required><Input type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} /></FormField>
            <FormField label="Reihenfolge"><Input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} /></FormField>
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex gap-2 mt-2">
              <Button onClick={handleSave} loading={saving}>Speichern</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Lädt...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sponsors.map((s) => (
            <div key={s.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-center p-4 h-28 bg-gray-50">
                <Image src={s.imageUrl} alt={s.name} width={120} height={60} className="object-contain max-h-16" unoptimized />
              </div>
              <div className="p-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => openEdit(s)} className="text-xs text-[#4577ac] hover:underline">Bearbeiten</button>
                  <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline ml-auto">Löschen</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
