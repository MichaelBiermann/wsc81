"use client";

import { useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function FeesPaidToggle({ id, feesPaid }: { id: string; feesPaid: boolean }) {
  const { t } = useAdminI18n();
  const [paid, setPaid] = useState(feesPaid);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feesPaid: !paid }),
    });
    if (res.ok) setPaid((v) => !v);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
        paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
      title={paid ? t.members.markUnpaid : t.members.markPaid}
    >
      {paid ? t.members.colPaid : t.members.colPending}
    </button>
  );
}
