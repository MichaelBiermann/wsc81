"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";

const OVERLAY_ID = "support-wizard-overlay";

export default function SupportOverlay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: session } = useSession();
  const t = useTranslations("Support");

  const isOpen = searchParams.get("support") === "open";
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);

  function close() {
    // Remove ?support=open from the URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("support");
    const qs = params.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
  }

  // When overlay opens: capture background (exclude overlay itself), then focus close button
  useEffect(() => {
    if (!isOpen) {
      setScreenshotDataUrl(null);
      return;
    }
    // Capture background page (the overlay isn't rendered yet on first tick, but we guard with filter anyway)
    setTimeout(() => closeBtnRef.current?.focus(), 50);

    // Check sessionStorage first (set by chat panel or forms section before navigation)
    const stored = sessionStorage.getItem("support_screenshot");
    if (stored) {
      setScreenshotDataUrl(stored);
      sessionStorage.removeItem("support_screenshot");
      return;
    }

    // Capture the background: exclude the overlay dialog itself
    import("html-to-image").then(({ toPng }) =>
      toPng(document.body, {
        pixelRatio: 0.5,
        filter: (node) => {
          const id = (node as HTMLElement).id;
          return id !== OVERLAY_ID && id !== "public-chat-panel";
        },
      })
    ).then((dataUrl) => {
      setScreenshotDataUrl(dataUrl);
    }).catch(() => {
      // non-fatal — SupportForm will handle missing screenshot
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Focus trap + Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "Tab") {
      const el = overlayRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!isOpen) return null;

  const isLoggedIn = !!session?.user;

  return (
    <div id={OVERLAY_ID}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={close}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-overlay-title"
        onKeyDown={handleKeyDown}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 id="support-overlay-title" className="text-lg font-bold text-gray-900">{t("title")}</h2>
              <p className="text-sm text-gray-500">{t("subtitle")}</p>
            </div>
            <button
              ref={closeBtnRef}
              onClick={close}
              aria-label={locale === "en" ? "Close support" : "Support schließen"}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22 }} aria-hidden="true">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {!isLoggedIn ? (
              <div>
                <p className="text-gray-600 mb-4">{t("loginRequired")}</p>
                <Link
                  href={`/${locale}/login`}
                  onClick={close}
                  className="inline-block bg-[#4577ac] text-white px-4 py-2 rounded font-medium hover:bg-[#2d5a8a] transition-colors"
                >
                  {t("loginLink")}
                </Link>
              </div>
            ) : (
              <SupportForm
                initialScreenshotDataUrl={screenshotDataUrl}
                onSuccess={close}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
