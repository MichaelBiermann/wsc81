"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

const modalTitleId = "forms-modal-title";

export default function FormsSection() {
  const t = useTranslations("Forms");
  const g = useTranslations("General");
  const locale = useLocale();
  const router = useRouter();
  const isDE = locale !== "en";

  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Focus management
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Move focus into modal when it opens; return focus when it closes
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    } else {
      triggerButtonRef.current?.focus();
    }
  }, [modalOpen]);

  // Focus trap + Escape key inside modal
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setModalOpen(false);
      return;
    }
    if (e.key === "Tab") {
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

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
    <>
    {/* Allgemeines section */}
    <section className="py-12 bg-white" aria-labelledby="general-section-title">
      <div className="mx-auto max-w-7xl px-4">
        <h2 id="general-section-title" className="text-2xl font-bold text-[#4577ac] mb-6">{g("title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* FIS Regeln — external link */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">rule</span>
            <p className="font-semibold text-gray-800">{g("fisRules")}</p>
            <a
              href="https://www.wsc81.de/seite/633564/fis-regeln.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">open_in_new</span>
              {isDE ? "Öffnen" : "Open"}
            </a>
          </div>

          {/* Cartoon — internal page */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">sentiment_very_satisfied</span>
            <p className="font-semibold text-gray-800">{g("cartoon")}</p>
            <Link
              href={`/${locale}/seite/cartoon`}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">arrow_forward</span>
              {isDE ? "Ansehen" : "View"}
            </Link>
          </div>

        </div>
      </div>
    </section>

    {/* Formulare section */}
    <section className="py-12 bg-gray-50" aria-labelledby="forms-section-title">
      <div className="mx-auto max-w-7xl px-4">
        <h2 id="forms-section-title" className="text-2xl font-bold text-[#4577ac] mb-6">{t("title")}</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* 1 — Walldorf-Pass PDF */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">picture_as_pdf</span>
            <p className="font-semibold text-gray-800">{t("walldorfPass")}</p>
            <a
              href="/documents/walldorfpass.pdf"
              download
              aria-label={isDE ? `${t("walldorfPass")} PDF herunterladen` : `Download ${t("walldorfPass")} PDF`}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">download</span>
              PDF
            </a>
          </div>

          {/* 2 — Aktualisierung Mitgliederdaten PDF */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">picture_as_pdf</span>
            <p className="font-semibold text-gray-800">{t("updateMemberData")}</p>
            <a
              href="/documents/aktualisierung-mitgliederdaten.pdf"
              download
              aria-label={isDE ? `${t("updateMemberData")} PDF herunterladen` : `Download ${t("updateMemberData")} PDF`}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">download</span>
              PDF
            </a>
          </div>

          {/* 3 — Erziehungsberechtigte PDF */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">picture_as_pdf</span>
            <p className="font-semibold text-gray-800">{t("guardianDeclaration")}</p>
            <a
              href="/documents/erziehungsberechtigte.pdf"
              download
              aria-label={isDE ? `${t("guardianDeclaration")} PDF herunterladen` : `Download ${t("guardianDeclaration")} PDF`}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">download</span>
              PDF
            </a>
          </div>

          {/* 4 — Beitrittsformular → /membership */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">how_to_reg</span>
            <p className="font-semibold text-gray-800">{t("membershipForm")}</p>
            <Link
              href={`/${locale}/membership`}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">arrow_forward</span>
              {isDE ? "Zum Formular" : "Open form"}
            </Link>
          </div>

          {/* 5 — Anmeldung Freizeit → modal */}
          <div className={cardBase}>
            <span className="material-symbols-rounded text-[#4577ac] text-3xl" aria-hidden="true">event</span>
            <p className="font-semibold text-gray-800">{t("eventRegistration")}</p>
            <button
              ref={triggerButtonRef}
              onClick={openModal}
              aria-haspopup="dialog"
              aria-expanded={modalOpen}
              className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline text-left"
            >
              <span className="material-symbols-rounded text-base" aria-hidden="true">arrow_forward</span>
              {isDE ? "Veranstaltung wählen" : "Select event"}
            </button>
          </div>

        </div>
      </div>

      {/* Event picker modal */}
      {/* Backdrop */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={closeModal}
          aria-hidden="true"
        />
      )}

      {/* Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        aria-hidden={!modalOpen}
        onKeyDown={handleModalKeyDown}
        className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${modalOpen ? "" : "hidden"}`}
      >
        <div
          className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 id={modalTitleId} className="font-semibold text-gray-800 text-lg">{t("pickEventTitle")}</h3>
            <button
              ref={closeBtnRef}
              onClick={closeModal}
              aria-label={isDE ? "Dialog schließen" : "Close dialog"}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {loading ? (
            <div
              role="status"
              aria-label={isDE ? "Veranstaltungen werden geladen" : "Loading events"}
              className="flex justify-center py-8"
            >
              <span className="material-symbols-rounded animate-spin text-[#4577ac] text-3xl" aria-hidden="true">
                progress_activity
              </span>
            </div>
          ) : events && events.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">{t("noEvents")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto" aria-label={isDE ? "Buchbare Veranstaltungen" : "Bookable events"}>
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
    </section>
    </>
  );
}
