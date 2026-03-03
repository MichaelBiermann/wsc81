"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LoginForm({
  locale,
  callbackUrl,
}: {
  locale: string;
  callbackUrl?: string;
}) {
  const t = useTranslations("Login");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const result = await signIn("user-credentials", {
      email,
      password,
      providerType: "user",
      redirect: false,
    });

    if (result?.ok) {
      router.push(callbackUrl ?? `/${locale}/account`);
    } else {
      setStatus("error");
      if (result?.error === "EMAIL_NOT_VERIFIED") {
        setErrorMsg(t("errors.notVerified"));
      } else {
        setErrorMsg(t("errors.invalidCredentials"));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label={t("fields.email")} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormField>

      <FormField label={t("fields.password")} required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </FormField>

      {status === "error" && <Alert variant="error">{errorMsg}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t("noAccount")}{" "}
        <Link href={`/${locale}/register`} className="text-[#4577ac] hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
