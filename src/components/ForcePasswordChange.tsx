"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface Props {
  locale: string;
  labels: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    save: string;
    wrongPassword: string;
    mismatch: string;
    tooShort: string;
    error: string;
  };
}

export default function ForcePasswordChange({ locale, labels }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.push(`/${locale}/account`);
    } else {
      const data = await res.json();
      setError(data.error === "wrong_password" ? labels.wrongPassword : labels.error);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <FormField label={labels.currentPassword} required>
        <Input
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
          required
          autoComplete="current-password"
        />
      </FormField>
      <FormField label={labels.newPassword} required>
        <Input
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
          required
          autoComplete="new-password"
        />
      </FormField>
      <FormField label={labels.confirmPassword} required>
        <Input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          required
          autoComplete="new-password"
        />
      </FormField>
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="submit" loading={saving} className="w-full">
        {labels.save}
      </Button>
    </form>
  );
}
