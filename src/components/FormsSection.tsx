"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EventItem {
  id: number;
  titleDe: string;
  titleEn: string;
  startDate: string;
  location: string | null;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function FormsSection() {
  const t = useTranslations("Forms");
  const locale = useLocale();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function openModal() {
    setModalOpen(true);
    if (events === null) {
      setLoading(true);
      try {
        const res = await fetch("/api/forms/events");
        const data = await res.json();
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
  }

  function closeModal() {
    setModalOpen(false);
  }

  function goToEvent(id: number) {
    closeModal();
    router.push(`/${locale}/events/${id}`);
  }

  const cardBase =
    "bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3";

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-2xl font-bold text-[#4577ac] mb-6">{t("title")}</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* 1 — Walldorf-Pass PDF */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl">description_2</span>
            <p className="font-semibold text-gray-800">{t("walldorfPass")}</p>
            <a
              href="/documents/walldorfpass.pdf"
              download
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base">download</span>
              PDF
            </a>
          </div>

          {/* 2 — Aktualisierung Mitgliederdaten PDF */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl">description_2</span>
            <p className="font-semibold text-gray-800">{t("updateMemberData")}</p>
            <a
              href="/documents/aktualisierung-mitgliederdaten.pdf"
              download
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base">download</span>
              PDF
            </a>
          </div>

          {/* 3 — Erziehungsberechtigte PDF */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl">description_2</span>
            <p className="font-semibold text-gray-800">{t("guardianDeclaration")}</p>
            <a
              href="/documents/erziehungsberechtigte.pdf"
              download
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base">download</span>
              PDF
            </a>
          </div>

          {/* 4 — Beitrittsformular → /membership */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl">how_to_reg</span>
            <p className="font-semibold text-gray-800">{t("membershipForm")}</p>
            <Link
              href={`/${locale}/membership`}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base">arrow_forward</span>
              {locale === "de" ? "Zum Formular" : "Open form"}
            </Link>
          </div>

          {/* 5 — Anmeldung Freizeit → modal */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl">event</span>
            <p className="font-semibold text-gray-800">{t("eventRegistration")}</p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline text-left"
            >
              <span className="material-symbols-rounded text-base">arrow_forward</span>
              {locale === "de" ? "Veranstaltung wählen" : "Select event"}
            </button>
          </div>

        </div>
      </div>

      {/* Event picker modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">{t("pickEventTitle")}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="material-symbols-rounded animate-spin text-[#4577ac] text-3xl">
                  progress_activity
                </span>
              </div>
            ) : events && events.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">{t("noEvents")}</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {events?.map((ev) => (
                  <li key={ev.id}>
                    <button
                      onClick={() => goToEvent(ev.id)}
                      className="w-full text-left py-3 px-1 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs text-gray-400 block">
                        {fmt(ev.startDate)}{ev.location ? ` — ${ev.location}` : ""}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {locale === "de" ? ev.titleDe : ev.titleEn}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
