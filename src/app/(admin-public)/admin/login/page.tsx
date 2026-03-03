"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { AdminLocale } from "@/lib/admin-i18n";
import { ADMIN_TRANSLATIONS } from "@/lib/admin-i18n";

function getInitialLocale(): AdminLocale {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)admin_locale=([^;]+)/);
    if (m?.[1] === "en") return "en";
  }
  return "de";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState<AdminLocale>("de");

  useEffect(() => {
    setLocale(getInitialLocale());
  }, []);

  const t = ADMIN_TRANSLATIONS[locale].login;

  const toggleLocale = () => {
    const next: AdminLocale = locale === "de" ? "en" : "de";
    setLocale(next);
    document.cookie = `admin_locale=${next}; path=/admin; max-age=31536000; SameSite=Lax`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("admin-credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t.errorInvalid);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#4577ac]">{t.title}</h1>
          <button onClick={toggleLocale} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            {locale === "de" ? "EN" : "DE"}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.emailLabel}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-[#4577ac] py-2 text-white font-medium hover:bg-[#2d5a8a] transition-colors disabled:opacity-50"
          >
            {loading ? "..." : t.submitButton}
          </button>
        </form>
      </div>
    </div>
  );
}
