"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const RECAP_SLUGS = [
  { slug: "auf-nach-lenggries", de: "Auf nach Lenggries…", en: "Off to Lenggries…" },
  { slug: "der-wsc-in-den-dolomiten", de: "Der WSC in den Dolomiten", en: "WSC in the Dolomites" },
  { slug: "ski-club-wochenende-am-arlberg", de: "Ski-Club Wochenende am Arlberg", en: "Ski-Club Weekend at Arlberg" },
  { slug: "saisonoeffnung-mit-oli-in-kuehtai", de: "Saisoneröffnung mit Oli in Kühtai", en: "Season Opening with Oli in Kühtai" },
  { slug: "walldorfer-weihnachtsmarkt", de: "Walldorfer Weihnachtsmarkt", en: "Walldorf Christmas Market" },
  { slug: "winterlicher-huettenzauber", de: "Winterlicher Hüttenzauber", en: "Winter Hut Magic" },
  { slug: "wandern-im-kraichgau", de: "Wandern im Kraichgau", en: "Hiking in the Kraichgau" },
];

export default function Nav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileClubOpen, setMobileClubOpen] = useState(false);
  const [mobileRecapsOpen, setMobileRecapsOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const [recapsMenuOpen, setRecapsMenuOpen] = useState(false);
  const clubRef = useRef<HTMLDivElement>(null);
  const recapsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const locale = pathname.startsWith("/en") ? "en" : "de";
  const otherLocale = locale === "de" ? "en" : "de";
  const isDE = locale === "de";

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clubRef.current && !clubRef.current.contains(e.target as Node)) setClubMenuOpen(false);
      if (recapsRef.current && !recapsRef.current.contains(e.target as Node)) setRecapsMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdowns on Escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setClubMenuOpen(false);
      setRecapsMenuOpen(false);
      setUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const switchLocale = () => {
    const newPath = pathname.replace(`/${locale}`, `/${otherLocale}`);
    router.push(newPath);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim().length >= 2) {
      router.push(`/${locale}/search?q=${encodeURIComponent(searchQ.trim())}`);
    }
  };

  const user = session?.user as { role?: string; firstName?: string; name?: string; avatarUrl?: string | null } | undefined;
  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!session && !isAdmin;
  const firstName = user?.firstName ?? user?.name?.split(" ")[0];
  const avatarUrl = user?.avatarUrl;

  const clubLinks = [
    { href: `/${locale}/verein`, label: t("clubAbout") },
    { href: `/${locale}/vorstand`, label: t("clubBoard") },
    { href: `/${locale}/uebungsleiter`, label: t("clubInstructors") },
    { href: `/${locale}/unterstuetzer`, label: t("clubSupporters") },
    { href: `/${locale}/sponsoren`, label: t("sponsors") },
    { href: `/${locale}/agb`, label: t("clubAgb") },
    { href: `/${locale}/satzung`, label: t("clubSatzung") },
  ];

  const searchLabel = isDE ? "Suche" : "Search";
  const searchSubmitLabel = isDE ? "Suche starten" : "Start search";

  return (
    <nav className="sticky top-0 z-50 bg-[#4577ac] text-white shadow-md overflow-visible" aria-label={isDE ? "Hauptnavigation" : "Main navigation"}>
      {/* Mountain silhouette — purely decorative */}
      <div className="w-full h-16 overflow-hidden bg-white pt-1" aria-hidden="true">
        <Image
          src="/images/berge-maske-header.png"
          alt=""
          width={1920}
          height={64}
          className="w-full h-full object-fill object-bottom"
          priority
        />
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between overflow-visible">
          {/* Logo / site title */}
          <Link href={`/${locale}`} scroll={true} onClick={() => window.scrollTo({ top: 0 })} className="flex md:items-start items-center" aria-label={isDE ? "Startseite – Walldorfer Ski-Club 81" : "Home – Walldorfer Ski-Club 81"}>
            <Image
              src="/images/logo-walldorfer-ski-club-81.png"
              alt="Walldorfer Ski-Club 81"
              width={160}
              height={157}
              className="object-contain relative z-10 h-14 w-auto md:h-[120px] md:[margin-top:72px]"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium" role="list">
            <Link href={`/${locale}`} className="hover:text-blue-200 transition-colors" role="listitem">
              {t("home")}
            </Link>

            {/* WSC 81 dropdown */}
            <div className="relative" ref={clubRef} role="listitem">
              <button
                onClick={() => setClubMenuOpen((v) => !v)}
                aria-expanded={clubMenuOpen}
                aria-haspopup="menu"
                aria-label={t("club")}
                className="flex items-center gap-1 hover:text-blue-200 transition-colors"
              >
                {t("club")} <span aria-hidden="true" className="text-xs">▾</span>
              </button>
              {clubMenuOpen && (
                <div
                  role="menu"
                  aria-label={t("club")}
                  className="absolute left-0 top-full mt-1 w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg text-gray-800 z-50"
                >
                  {clubLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      onClick={() => setClubMenuOpen(false)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Rückblicke dropdown */}
            <div className="relative" ref={recapsRef} role="listitem">
              <button
                onClick={() => setRecapsMenuOpen((v) => !v)}
                aria-expanded={recapsMenuOpen}
                aria-haspopup="menu"
                aria-label={t("recaps")}
                className="flex items-center gap-1 hover:text-blue-200 transition-colors"
              >
                {t("recaps")} <span aria-hidden="true" className="text-xs">▾</span>
              </button>
              {recapsMenuOpen && (
                <div
                  role="menu"
                  aria-label={t("recaps")}
                  className="absolute left-0 top-full mt-1 w-64 rounded-md border border-gray-200 bg-white py-1 shadow-lg text-gray-800 z-50"
                >
                  <Link
                    href={`/${locale}/rueckblicke`}
                    role="menuitem"
                    className="block px-4 py-2 text-sm font-medium text-[#4577ac] hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100"
                    onClick={() => setRecapsMenuOpen(false)}
                  >
                    {isDE ? "Alle Rückblicke" : "All Recaps"}
                  </Link>
                  {RECAP_SLUGS.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/${locale}/rueckblicke/${r.slug}`}
                      role="menuitem"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      onClick={() => setRecapsMenuOpen(false)}
                    >
                      {isDE ? r.de : r.en}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={`/${locale}/membership`}
              className="hidden lg:inline-block rounded bg-white text-[#4577ac] px-3 py-1.5 font-semibold hover:bg-blue-100 transition-colors"
              role="listitem"
            >
              {t("membership")}
            </Link>
          </div>

          {/* Search + auth + language switcher */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden lg:flex items-center" role="search">
              <label htmlFor="nav-search-desktop" className="sr-only">{searchLabel}</label>
              <input
                id="nav-search-desktop"
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t("search")}
                className="rounded-l border-0 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none w-36"
              />
              <button
                type="submit"
                aria-label={searchSubmitLabel}
                className="rounded-r bg-[#2d5a8a] px-3 py-1.5 text-sm hover:bg-[#1e3d60] transition-colors flex items-center"
              >
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }} aria-hidden="true">search</span>
              </button>
            </form>

            {/* Auth section */}
            {isLoggedIn ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label={isDE ? `Konto von ${firstName ?? "Nutzer"} – Menü öffnen` : `Account of ${firstName ?? "user"} – open menu`}
                  className="flex items-center gap-2 rounded border border-white/50 px-2 py-1 text-sm hover:bg-white/20 transition-colors"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" aria-hidden="true" width={24} height={24} className="rounded-full object-cover w-6 h-6" unoptimized />
                  ) : (
                    <span className="material-symbols-rounded" style={{ fontSize: "20px" }} aria-hidden="true">person</span>
                  )}
                  {t("hello", { name: firstName ?? "" })} <span aria-hidden="true">▾</span>
                </button>
                {userMenuOpen && (
                  <div role="menu" aria-label={isDE ? "Konto-Menü" : "Account menu"} className="absolute right-0 top-full mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg text-gray-800">
                    <Link
                      href={`/${locale}/account`}
                      role="menuitem"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t("myAccount")}
                    </Link>
                    <Link
                      href={`/${locale}/account#bookings`}
                      role="menuitem"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t("myBookings")}
                    </Link>
                    <button
                      role="menuitem"
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: `/${locale}` }); }}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-red-600"
                    >
                      {t("signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/${locale}/register`} className="text-sm hover:text-blue-200 transition-colors">
                  {t("register")}
                </Link>
                <Link href={`/${locale}/login`} className="rounded border border-white px-3 py-1 text-sm hover:bg-white/20 transition-colors">
                  {t("login")}
                </Link>
              </div>
            )}

            <button
              onClick={switchLocale}
              aria-label={isDE ? `Sprache wechseln zu Englisch` : `Switch language to German`}
              className="rounded border border-white/50 px-2 py-1 text-xs hover:bg-white/20 transition-colors"
            >
              {otherLocale.toUpperCase()}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? (isDE ? "Menü schließen" : "Close menu") : (isDE ? "Menü öffnen" : "Open menu")}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <span className="material-symbols-rounded" style={{ fontSize: "22px" }} aria-hidden="true">{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div id="mobile-menu" className="md:hidden pb-4 flex flex-col gap-3 border-t border-white/20 pt-3 relative z-20 bg-[#4577ac]">
            <Link href={`/${locale}`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("home")}</Link>

            {/* Mobile WSC 81 section */}
            <button
              className="text-left hover:text-blue-200 flex items-center gap-1"
              onClick={() => setMobileClubOpen((v) => !v)}
              aria-expanded={mobileClubOpen}
              aria-controls="mobile-club-menu"
            >
              {t("club")} <span aria-hidden="true" className="text-xs">{mobileClubOpen ? "▴" : "▾"}</span>
            </button>
            {mobileClubOpen && (
              <div id="mobile-club-menu" className="pl-4 flex flex-col gap-2 border-l border-white/30">
                {clubLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="text-sm hover:text-blue-200" onClick={() => setMobileOpen(false)}>
                    {l.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile Rückblicke section */}
            <button
              className="text-left hover:text-blue-200 flex items-center gap-1"
              onClick={() => setMobileRecapsOpen((v) => !v)}
              aria-expanded={mobileRecapsOpen}
              aria-controls="mobile-recaps-menu"
            >
              {t("recaps")} <span aria-hidden="true" className="text-xs">{mobileRecapsOpen ? "▴" : "▾"}</span>
            </button>
            {mobileRecapsOpen && (
              <div id="mobile-recaps-menu" className="pl-4 flex flex-col gap-2 border-l border-white/30">
                <Link href={`/${locale}/rueckblicke`} className="text-sm font-medium hover:text-blue-200" onClick={() => setMobileOpen(false)}>
                  {isDE ? "Alle Rückblicke" : "All Recaps"}
                </Link>
                {RECAP_SLUGS.map((r) => (
                  <Link key={r.slug} href={`/${locale}/rueckblicke/${r.slug}`} className="text-sm hover:text-blue-200" onClick={() => setMobileOpen(false)}>
                    {isDE ? r.de : r.en}
                  </Link>
                ))}
              </div>
            )}

            <Link href={`/${locale}/membership`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("membership")}</Link>
            {isLoggedIn ? (
              <>
                <Link href={`/${locale}/account`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("myAccount")}</Link>
                <Link href={`/${locale}/account#bookings`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("myBookings")}</Link>
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: `/${locale}` }); }} className="text-left hover:text-blue-200 text-red-200">{t("signOut")}</button>
              </>
            ) : (
              <>
                <Link href={`/${locale}/register`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("register")}</Link>
                <Link href={`/${locale}/login`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
              </>
            )}
            <form onSubmit={handleSearch} className="flex" role="search">
              <label htmlFor="nav-search-mobile" className="sr-only">{searchLabel}</label>
              <input
                id="nav-search-mobile"
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t("search")}
                className="flex-1 rounded-l bg-white px-3 py-1.5 text-sm text-gray-800"
              />
              <button type="submit" aria-label={searchSubmitLabel} className="rounded-r bg-[#2d5a8a] px-3 py-1.5 text-sm flex items-center">
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }} aria-hidden="true">search</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
