"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Anmeldung wirklich löschen?")) return;
    setLoading(true);
    await fetch(`/api/admin/members/pending/${id}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Löschen"}
    </button>
  );
}
