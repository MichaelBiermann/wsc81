"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("Footer");
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "de";

  return (
    <footer className="bg-[#4577ac] text-white mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">Walldorfer Ski-Club 81 e.V.</h3>
            <p className="text-blue-100 text-sm">
              Postfach 1234<br />
              69190 Walldorf<br />
              <a href="mailto:vorstand@wsc81.de" className="hover:text-white">vorstand@wsc81.de</a>
            </p>
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Links</h4>
              <ul className="space-y-1 text-blue-100">
                <li><Link href={`/${locale}/impressum`} className="hover:text-white">{t("imprint")}</Link></li>
                <li><Link href={`/${locale}/datenschutz`} className="hover:text-white">{t("privacy")}</Link></li>
                <li><Link href={`/${locale}/membership`} className="hover:text-white">Mitglied werden</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-4 text-center text-xs text-blue-200">
          © {new Date().getFullYear()} Walldorfer Ski-Club 81 e.V. — {t("rights")}
        </div>
      </div>
    </footer>
  );
}
