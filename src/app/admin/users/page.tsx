"use client";

import { useEffect, useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  locale: string;
  createdAt: string;
  memberId: string | null;
  _count: { bookings: number };
}

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
}

export default function AdminUsersPage() {
  const { t } = useAdminI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ firstName: "", lastName: "", email: "", emailVerified: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t.users.deleteConfirm.replace("{name}", name))) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, emailVerified: u.emailVerified });
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditUser(null);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.users.title}</h1>
        <span className="text-sm text-gray-400">{users.length} {t.users.total}</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colName}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colEmail}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colVerified}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colMember}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colBookings}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colRegistered}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.users.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t.loading}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t.users.noUsers}</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.emailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {u.emailVerified ? t.users.verified : t.users.unverified}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.memberId
                    ? <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{t.users.isMember}</span>
                    : <span className="text-gray-400">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-600">{u._count.bookings}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-sm text-[#4577ac] hover:underline"
                  >
                    {t.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.users.editTitle}</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.users.fieldFirstName}</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.users.fieldLastName}</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.users.fieldEmail}</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4577ac]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailVerified"
                  checked={editForm.emailVerified}
                  onChange={(e) => setEditForm((f) => ({ ...f, emailVerified: e.target.checked }))}
                  className="accent-[#4577ac]"
                />
                <label htmlFor="emailVerified" className="text-sm text-gray-700">{t.users.fieldVerified}</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditUser(null)}
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
