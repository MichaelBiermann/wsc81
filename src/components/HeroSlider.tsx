"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "https://daten.verwaltungsportal.de/dateien/menuAdministration/1/7/0/5/4/3/sliderImage170543.jpg", alt: "Arlberg Ski" },
  { src: "https://daten.verwaltungsportal.de/dateien/menuAdministration/1/7/0/5/4/5/sliderImage170545.jpg", alt: "Arlberg Ski 2" },
  { src: "https://daten.verwaltungsportal.de/dateien/menuAdministration/1/8/7/8/2/7/IMG-20220209-WA0000.jpg", alt: "Arlberg Ski 3" },
];

export default function HeroSlider({ locale }: { locale: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[206px] md:h-[265px] overflow-hidden bg-[#2d5a8a]">
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={i === 0}
            unoptimized
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg mb-3">
            Walldorfer Ski-Club 81 e.V.
          </h1>
          <p className="text-lg md:text-xl drop-shadow">
            Ski- und Fitnessgymnastik · Nordic Walking · Skifreizeiten
          </p>
          <a
            href={`/${locale}/membership`}
            className="mt-6 inline-block rounded bg-white text-[#4577ac] font-bold px-6 py-3 hover:bg-blue-50 transition-colors"
          >
            {locale === "de" ? "Jetzt Mitglied werden" : "Become a Member"}
          </a>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
