"use client";

import { useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function DeleteButton({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const { t } = useAdminI18n();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t.pendingMembers.deleteConfirm)) return;
    setLoading(true);
    await fetch(`/api/admin/members/pending/${id}`, { method: "DELETE" });
    setLoading(false);
    if (onDeleted) onDeleted();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {loading ? t.loading : t.delete}
    </button>
  );
}
