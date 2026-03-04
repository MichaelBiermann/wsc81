"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import AvatarUpload from "@/components/AvatarUpload";

export default function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations("Register");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    street: "",
    postalCode: "",
    city: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setErrorMsg(t("errors.passwordMismatch"));
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    // Use multipart/form-data so we can attach the avatar in the same request
    const fd = new FormData();
    fd.append("firstName", form.firstName);
    fd.append("lastName", form.lastName);
    fd.append("dob", form.dob);
    fd.append("street", form.street);
    fd.append("postalCode", form.postalCode);
    fd.append("city", form.city);
    fd.append("phone", form.phone);
    fd.append("email", form.email);
    fd.append("password", form.password);
    fd.append("locale", locale);
    if (avatarFile) fd.append("avatar", avatarFile);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: fd,
    });

    if (res.ok || res.status === 201) {
      setRegisteredEmail(form.email);
      setStatus("success");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setErrorMsg(data.error ?? t("errors.generic"));
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-3xl mb-3">✉️</div>
        <h2 className="font-semibold text-green-800 mb-2">{t("success.title")}</h2>
        <p className="text-green-700 text-sm">{t("success.message", { email: registeredEmail })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Avatar */}
      <div className="flex justify-center py-2">
        <AvatarUpload
          liveUpload={false}
          onFileSelected={setAvatarFile}
          labels={{
            upload: t("avatar.upload"),
            change: t("avatar.change"),
            remove: t("avatar.remove"),
            invalidType: t("avatar.invalidType"),
            tooLarge: t("avatar.tooLarge"),
            error: t("avatar.error"),
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t("fields.firstName")} required>
          <Input value={form.firstName} onChange={set("firstName")} required autoComplete="given-name" />
        </FormField>
        <FormField label={t("fields.lastName")} required>
          <Input value={form.lastName} onChange={set("lastName")} required autoComplete="family-name" />
        </FormField>
      </div>

      <FormField label={t("fields.dob")} required>
        <Input type="date" value={form.dob} onChange={set("dob")} required />
      </FormField>

      <FormField label={t("fields.street")} required>
        <Input value={form.street} onChange={set("street")} required autoComplete="street-address" />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={t("fields.postalCode")} required>
          <Input value={form.postalCode} onChange={set("postalCode")} pattern="\d{5}" required autoComplete="postal-code" />
        </FormField>
        <FormField label={t("fields.city")} required>
          <Input value={form.city} onChange={set("city")} required autoComplete="address-level2" />
        </FormField>
      </div>

      <FormField label={t("fields.phone")} required>
        <Input type="tel" value={form.phone} onChange={set("phone")} required autoComplete="tel" />
      </FormField>

      <FormField label={t("fields.email")} required>
        <Input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
      </FormField>

      <FormField label={t("fields.password")} required>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
            autoComplete="new-password"
            className="pr-20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
          >
            {showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
          </button>
        </div>
      </FormField>

      <FormField label={t("fields.confirmPassword")} required>
        <Input
          type={showPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          required
          autoComplete="new-password"
        />
      </FormField>

      {status === "error" && <Alert variant="error">{errorMsg}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t("hasAccount")}{" "}
        <Link href={`/${locale}/login`} className="text-[#4577ac] hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
