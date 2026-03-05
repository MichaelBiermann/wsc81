"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const passwordReset = searchParams.get("passwordReset") === "1";
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
      const session = await getSession();
      const mustChange = (session?.user as { mustChangePassword?: boolean })?.mustChangePassword;
      if (mustChange) {
        router.push(`/${locale}/account/change-password`);
      } else {
        router.push(callbackUrl ?? `/${locale}/account`);
      }
    } else {
      setStatus("error");
      if (result?.code === "EMAIL_NOT_VERIFIED") {
        setErrorMsg(t("errors.notVerified"));
      } else {
        setErrorMsg(t("errors.invalidCredentials"));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {passwordReset && <Alert variant="success">{t("passwordResetSuccess")}</Alert>}
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

      <div className="text-right -mt-2">
        <Link href={`/${locale}/forgot-password`} className="text-sm text-[#4577ac] hover:underline">
          {t("forgotPassword")}
        </Link>
      </div>

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
