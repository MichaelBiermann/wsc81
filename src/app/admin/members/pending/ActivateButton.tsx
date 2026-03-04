"use client";

import { useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function ActivateButton({ id, onActivated }: { id: string; onActivated?: () => void }) {
  const { t } = useAdminI18n();
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!confirm(t.pendingMembers.activateConfirm)) return;
    setLoading(true);
    await fetch(`/api/admin/members/pending/${id}`, { method: "POST" });
    setLoading(false);
    if (onActivated) onActivated();
  };

  return (
    <button
      onClick={handleActivate}
      disabled={loading}
      className="rounded px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
    >
      {loading ? t.loading : t.pendingMembers.activate}
    </button>
  );
}
