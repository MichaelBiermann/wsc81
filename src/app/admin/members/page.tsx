"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import FeesPaidToggle from "./FeesPaidToggle";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  de: { FAMILIE: "Familie", ERWACHSENE: "Erwachsene", JUGENDLICHE: "Jugendliche", SENIOREN: "Senioren", GDB: "GdB ab 50%" },
  en: { FAMILIE: "Family", ERWACHSENE: "Adults", JUGENDLICHE: "Youth", SENIOREN: "Seniors", GDB: "Disability ≥50%" },
};

const CATEGORIES = ["FAMILIE", "ERWACHSENE", "JUGENDLICHE", "SENIOREN", "GDB"];

interface Member {
  id: string;
  memberNumber: number;
  person1Name: string;
  person2Name: string | null;
  person3Name: string | null;
  person4Name: string | null;
  person5Name: string | null;
  person6Name: string | null;
  person7Name: string | null;
  person8Name: string | null;
  person9Name: string | null;
  person10Name: string | null;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  category: string;
  feesPaid: boolean;
  activatedAt: string;
}

type EditForm = Pick<Member,
  "person1Name" | "person2Name" | "person3Name" | "person4Name" | "person5Name" |
  "person6Name" | "person7Name" | "person8Name" | "person9Name" | "person10Name" |
  "email" | "phone" | "street" | "postalCode" | "city" | "category"
>;

export default function AdminMembersPage() {
  const { t, locale } = useAdminI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/members").then((r) => r.json()).then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.de;

  const openEdit = (m: Member) => {
    setEditMember(m);
    setEditForm({
      person1Name: m.person1Name, person2Name: m.person2Name ?? "",
      person3Name: m.person3Name ?? "", person4Name: m.person4Name ?? "",
      person5Name: m.person5Name ?? "", person6Name: m.person6Name ?? "",
      person7Name: m.person7Name ?? "", person8Name: m.person8Name ?? "",
      person9Name: m.person9Name ?? "", person10Name: m.person10Name ?? "",
      email: m.email, phone: m.phone,
      street: m.street, postalCode: m.postalCode, city: m.city,
      category: m.category,
    });
  };

  const handleSave = async () => {
    if (!editMember || !editForm) return;
    setSaving(true);
    // Normalize empty strings to null for optional persons
    const data = { ...editForm };
    for (let i = 2; i <= 10; i++) {
      const key = `person${i}Name` as keyof EditForm;
      if (!data[key]) (data as Record<string, unknown>)[key] = null;
    }
    const res = await fetch(`/api/admin/members/${editMember.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      setEditMember(null);
    }
    setSaving(false);
  };

  const handleDelete = async (m: Member) => {
    if (!confirm(t.members.deleteConfirm.replace("{name}", m.person1Name))) return;
    const res = await fetch(`/api/admin/members/${m.id}`, { method: "DELETE" });
    if (res.ok) setMembers((prev) => prev.filter((x) => x.id !== m.id));
  };

  const personKeys = [
    "person1Name", "person2Name", "person3Name", "person4Name", "person5Name",
    "person6Name", "person7Name", "person8Name", "person9Name", "person10Name",
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.members.title}</h1>
        <Link href="/admin/members/pending" className="text-sm text-[#4577ac] hover:underline">
          {t.members.pendingLink}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colName}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colEmail}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colCategory}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colFee}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colActivated}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && members.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">—</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{m.memberNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.person1Name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">{catLabels[m.category] ?? m.category}</td>
                <td className="px-4 py-3">
                  <FeesPaidToggle id={m.id} feesPaid={m.feesPaid} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(m.activatedAt).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <button onClick={() => openEdit(m)} className="text-sm text-[#4577ac] hover:underline">
                    {t.edit}
                  </button>
                  <button onClick={() => handleDelete(m)} className="text-sm text-red-600 hover:underline">
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editMember && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t.members.editTitle} #{editMember.memberNumber}</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.members.fieldCategory}</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => f && ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{catLabels[c] ?? c}</option>
                  ))}
                </select>
              </div>
              {/* Contact */}
              {([
                ["email", t.members.fieldEmail],
                ["phone", t.members.fieldPhone],
                ["street", t.members.fieldStreet],
                ["postalCode", t.members.fieldPostalCode],
                ["city", t.members.fieldCity],
              ] as [keyof EditForm, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(editForm[field] as string) ?? ""}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
                  />
                </div>
              ))}
              {/* Persons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.members.fieldPersons}</label>
                <div className="flex flex-col gap-1.5">
                  {personKeys.map((key, i) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={`Person ${i + 1}`}
                      value={(editForm[key] as string) ?? ""}
                      onChange={(e) => setEditForm((f) => f && ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setEditMember(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-[#4577ac] hover:bg-[#3a6699] disabled:opacity-50 rounded transition-colors"
              >
                {saving ? "…" : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
