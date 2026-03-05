"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  const { data: session } = useSession();

  const locale = pathname.startsWith("/en") ? "en" : "de";
  const otherLocale = locale === "de" ? "en" : "de";
  const isDE = locale === "de";

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clubRef.current && !clubRef.current.contains(e.target as Node)) setClubMenuOpen(false);
      if (recapsRef.current && !recapsRef.current.contains(e.target as Node)) setRecapsMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  return (
    <nav className="sticky top-0 z-50 bg-[#4577ac] text-white shadow-md overflow-visible">
      {/* Mountain silhouette decorative bar */}
      <div className="w-full h-16 overflow-hidden bg-white pt-1">        <Image
          src="/images/berge-maske-header.png"
          alt=""
          width={1920}
          height={64}
          className="w-full h-full object-contain object-bottom"
          priority
        />
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between overflow-visible">
          {/* Logo / site title */}
          <Link href={`/${locale}`} className="flex items-start">
            <Image
              src="/images/logo-walldorfer-ski-club-81.png"
              alt="Walldorfer Ski-Club 81"
              width={120}
              height={120}
              className="w-auto object-contain relative z-10"
              style={{ height: "120px", marginTop: "72px" }}
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href={`/${locale}`} className="hover:text-blue-200 transition-colors">
              {t("home")}
            </Link>

            {/* WSC 81 dropdown */}
            <div className="relative" ref={clubRef}>
              <button
                onClick={() => setClubMenuOpen((v) => !v)}
                className="flex items-center gap-1 hover:text-blue-200 transition-colors"
              >
                {t("club")} <span className="text-xs">▾</span>
              </button>
              {clubMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg text-gray-800 z-50">
                  {clubLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setClubMenuOpen(false)}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Rückblicke dropdown */}
            <div className="relative" ref={recapsRef}>
              <button
                onClick={() => setRecapsMenuOpen((v) => !v)}
                className="flex items-center gap-1 hover:text-blue-200 transition-colors"
              >
                {t("recaps")} <span className="text-xs">▾</span>
              </button>
              {recapsMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-64 rounded-md border border-gray-200 bg-white py-1 shadow-lg text-gray-800 z-50">
                  <Link
                    href={`/${locale}/rueckblicke`}
                    className="block px-4 py-2 text-sm font-medium text-[#4577ac] hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => setRecapsMenuOpen(false)}
                  >
                    {isDE ? "Alle Rückblicke" : "All Recaps"}
                  </Link>
                  {RECAP_SLUGS.map((r) => (
                    <Link
                      key={r.slug}
                      href={`/${locale}/rueckblicke/${r.slug}`}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setRecapsMenuOpen(false)}
                    >
                      {isDE ? r.de : r.en}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href={`/${locale}/membership`} className="hidden lg:inline-block rounded bg-white text-[#4577ac] px-3 py-1.5 font-semibold hover:bg-blue-100 transition-colors">
              {t("membership")}
            </Link>
          </div>

          {/* Search + auth + language switcher */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="hidden lg:flex items-center">
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t("search")}
                className="rounded-l border-0 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none w-36"
              />
              <button
                type="submit"
                className="rounded-r bg-[#2d5a8a] px-3 py-1.5 text-sm hover:bg-[#1e3d60] transition-colors flex items-center"
              >
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>search</span>
              </button>
            </form>

            {/* Auth section */}
            {isLoggedIn ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded border border-white/50 px-2 py-1 text-sm hover:bg-white/20 transition-colors"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={firstName ?? ""} width={24} height={24} className="rounded-full object-cover w-6 h-6" unoptimized />
                  ) : (
                    <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>person</span>
                  )}
                  {t("hello", { name: firstName ?? "" })} ▾
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg text-gray-800">
                    <Link
                      href={`/${locale}/account`}
                      className="block px-4 py-2 text-sm hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t("myAccount")}
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: `/${locale}` }); }}
                      className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50 text-red-600"
                    >
                      {t("signOut")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href={`/${locale}/register`}
                  className="text-sm hover:text-blue-200 transition-colors"
                >
                  {t("register")}
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className="rounded border border-white px-3 py-1 text-sm hover:bg-white/20 transition-colors"
                >
                  {t("login")}
                </Link>
              </div>
            )}

            <button
              onClick={switchLocale}
              className="rounded border border-white/50 px-2 py-1 text-xs hover:bg-white/20 transition-colors"
            >
              {otherLocale.toUpperCase()}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-rounded" style={{ fontSize: "22px" }}>{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3 border-t border-white/20 pt-3">
            <Link href={`/${locale}`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("home")}</Link>

            {/* Mobile WSC 81 section */}
            <button
              className="text-left hover:text-blue-200 flex items-center gap-1"
              onClick={() => setMobileClubOpen((v) => !v)}
            >
              {t("club")} <span className="text-xs">{mobileClubOpen ? "▴" : "▾"}</span>
            </button>
            {mobileClubOpen && (
              <div className="pl-4 flex flex-col gap-2 border-l border-white/30">
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
            >
              {t("recaps")} <span className="text-xs">{mobileRecapsOpen ? "▴" : "▾"}</span>
            </button>
            {mobileRecapsOpen && (
              <div className="pl-4 flex flex-col gap-2 border-l border-white/30">
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
                <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: `/${locale}` }); }} className="text-left hover:text-blue-200 text-red-200">{t("signOut")}</button>
              </>
            ) : (
              <>
                <Link href={`/${locale}/register`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("register")}</Link>
                <Link href={`/${locale}/login`} className="hover:text-blue-200" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
              </>
            )}
            <form onSubmit={handleSearch} className="flex">
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t("search")}
                className="flex-1 rounded-l bg-white px-3 py-1.5 text-sm text-gray-800"
              />
              <button type="submit" className="rounded-r bg-[#2d5a8a] px-3 py-1.5 text-sm flex items-center">
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>search</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
