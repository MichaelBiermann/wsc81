"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ADMIN_TRANSLATIONS, AdminLocale, AdminTranslations } from "@/lib/admin-i18n";

const COOKIE_NAME = "admin_locale";

interface AdminI18nContextValue {
  t: AdminTranslations;
  locale: AdminLocale;
  setLocale: (locale: AdminLocale) => void;
}

const AdminI18nContext = createContext<AdminI18nContextValue>({
  t: ADMIN_TRANSLATIONS.de,
  locale: "de",
  setLocale: () => {},
});

export function AdminI18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: AdminLocale;
}) {
  const [locale, setLocaleState] = useState<AdminLocale>(initialLocale);

  const setLocale = (newLocale: AdminLocale) => {
    setLocaleState(newLocale);
    document.cookie = `${COOKIE_NAME}=${newLocale}; path=/admin; max-age=31536000; SameSite=Lax`;
  };

  return (
    <AdminI18nContext.Provider
      value={{ t: ADMIN_TRANSLATIONS[locale] as AdminTranslations, locale, setLocale }}
    >
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  return useContext(AdminI18nContext);
}
