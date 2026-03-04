"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ResetPasswordForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations("ResetPassword");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!token) {
    return <Alert variant="error">{t("invalidToken")}</Alert>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setErrorMsg(t("mismatch"));
      return;
    }
    setStatus("submitting");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      router.push(`/${locale}/login?passwordReset=1`);
    } else {
      const data = await res.json();
      setStatus("error");
      setErrorMsg(data.error === "expired_token" ? t("expiredToken") : t("invalidToken"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={t("newPassword")} required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </FormField>

      <FormField label={t("confirmPassword")} required>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
      </FormField>

      {status === "error" && <Alert variant="error">{errorMsg}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
