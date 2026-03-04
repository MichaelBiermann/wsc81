"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Link from "next/link";

export default function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("ForgotPassword");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setStatus(res.ok ? "sent" : "error");
  };

  if (status === "sent") {
    return <Alert variant="success">{t("sent")}</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={t("emailLabel")} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormField>

      {status === "error" && <Alert variant="error">{t("error")}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-sm text-gray-500">
        <Link href={`/${locale}/login`} className="text-[#4577ac] hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
