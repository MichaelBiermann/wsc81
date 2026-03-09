"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxSvgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setRendered(true);
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart]);

  // Sync SVG into lightbox when it opens
  useEffect(() => {
    if (lightboxOpen && lightboxSvgRef.current && ref.current) {
      lightboxSvgRef.current.innerHTML = ref.current.innerHTML;
      setZoom(1);
    }
  }, [lightboxOpen]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (lightboxOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, handleKeyDown]);

  // Wheel zoom inside lightbox
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(0.25, z - e.deltaY * 0.001)));
  }, []);

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {title && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>}
        {error ? (
          <p className="text-red-500 text-xs">{error}</p>
        ) : (
          <div className="relative group">
            <div ref={ref} className="overflow-x-auto flex justify-center" />
            {rendered && (
              <button
                onClick={() => setLightboxOpen(true)}
                aria-label="Diagram vergrößern"
                className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/90 border border-gray-200 px-2 py-1 text-xs text-gray-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 15 }} aria-hidden="true">zoom_in</span>
                Zoom
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Diagram"}
          className="fixed inset-0 z-[200] bg-black/70 flex flex-col"
          onClick={(e) => { if (e.target === lightboxRef.current) setLightboxOpen(false); }}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 flex-shrink-0" data-no-print>
            <div className="flex items-center gap-3">
              {title && <span className="text-sm text-gray-300 font-medium">{title}</span>}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                  className="flex items-center justify-center w-7 h-7 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                  aria-label="Verkleinern"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">remove</span>
                </button>
                <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                  className="flex items-center justify-center w-7 h-7 rounded text-gray-300 hover:bg-gray-700 transition-colors"
                  aria-label="Vergrößern"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">add</span>
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="ml-1 text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-gray-700 transition-colors"
                  aria-label="Zoom zurücksetzen"
                >
                  1:1
                </button>
              </div>
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Schließen"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }} aria-hidden="true">close</span>
            </button>
          </div>

          {/* Scrollable canvas */}
          <div
            className="flex-1 overflow-auto flex items-start justify-center p-8 cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
          >
            <div
              ref={lightboxSvgRef}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.1s ease" }}
              className="bg-white rounded-lg p-6 shadow-2xl [&_svg]:max-w-none"
            />
          </div>

          <p className="text-center text-xs text-gray-500 pb-2 flex-shrink-0" data-no-print>
            Scroll to zoom · Click outside to close · Esc to close
          </p>
        </div>
      )}
    </>
  );
}
