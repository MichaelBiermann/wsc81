"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

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
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }
    render();
    return () => { cancelled = true; };
  }, [chart]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {title && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>}
      {error ? (
        <p className="text-red-500 text-xs">{error}</p>
      ) : (
        <div ref={ref} className="overflow-x-auto flex justify-center" />
      )}
    </div>
  );
}
