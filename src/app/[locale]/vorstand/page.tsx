import { getLocale } from "next-intl/server";
import Image from "next/image";

const BOARD = [
  { role: "1. Vorsitzende", name: "Birgit Böhli-Tretschock", email: "birgit.tretschock@wsc81.de", phone: "06227/9041", img: "/images/vorstand/birgit-boehli-tretschock.jpg" },
  { role: "2. Vorsitzende", name: "Birgit Lehment-Oelert", email: "birgit.lehment@wsc81.de", phone: "06227/891868", img: "/images/vorstand/birgit-lehment-oelert.png" },
  { role: "Kassierer", name: "Bernhard Lucas", email: "bernhard.lucas@wsc81.de", phone: "06227/399 83 64", img: "/images/vorstand/bernhard-lucas.jpg" },
  { role: "Schriftführer", name: "Gerhard Rehbein", email: "gerhard.rehbein@wsc81.de", phone: "0152/2676 7690", img: "/images/vorstand/gerhard-rehbein.webp" },
  { role: "Sportwart", name: "Volker Tretschock", email: "volker.tretschock@wsc81.de", phone: "06227/9041", img: "/images/vorstand/volker-tretschock.jpg" },
  { role: "Jugendwart", name: "—", email: null, phone: null, img: "/images/vorstand/jugendwart.webp" },
  { role: "Beisitzer", name: "Michael Biermann", email: "michael.biermann@wsc81.de", phone: "0176/91 33 92 16", img: "/images/vorstand/michael-biermann.webp" },
  { role: "Beisitzer", name: "Maic Wintel", email: "maic.wintel@wsc81.de", phone: "0160/9081 9487", img: "/images/vorstand/maic-wintel.webp" },
  { role: "Beisitzer", name: "Manfred Hartmann", email: "manfred.hartmann@wsc81.de", phone: "0157/3648 7182", img: "/images/vorstand/manfred-hartmann.webp" },
];

export default async function VorstandPage() {
  const locale = await getLocale();
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 pt-20">
      <h1 className="text-3xl font-bold text-[#4577ac] mb-2">
        {isDE ? "Vorstandsteam" : "Board of Directors"}
      </h1>
      <p className="text-gray-500 mb-8">
        {isDE ? "Der Vorstand des Walldorfer Ski-Club 81 e.V." : "The board of Walldorfer Ski-Club 81 e.V."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BOARD.map((m) => (
          <div key={m.name + m.role} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {m.img ? (
              <div className="relative bg-gray-100" style={{ height: "25rem", width: "20rem" }}>
                <Image src={m.img} alt={m.name} fill className="object-cover object-top" />
              </div>
            ) : (
              <div className="bg-gray-100 flex items-center justify-center text-gray-300 text-5xl" style={{ height: "25rem", width: "20rem" }}>👤</div>
            )}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4577ac] mb-1">{m.role}</p>
              <p className="font-semibold text-gray-900">{m.name}</p>
              {m.phone && <p className="text-sm text-gray-500 mt-1">📞 {m.phone}</p>}
              {m.email && (
                <p className="text-sm mt-0.5">
                  <a href={`mailto:${m.email}`} className="text-[#4577ac] hover:underline">{m.email}</a>
                </p>
              )}
              {!m.email && m.name === "—" && (
                <p className="text-sm text-gray-400 mt-1 italic">
                  {isDE ? "Position vakant – Bewerbungen willkommen" : "Position vacant — applications welcome"}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#eef3f9] rounded-lg p-5 mt-8 text-sm text-gray-700">
        <p className="font-semibold text-[#4577ac] mb-2">{isDE ? "Vereinsadresse" : "Club Address"}</p>
        <p>Walldorfer Ski-Club 81 e.V.</p>
        <p>Postfach 1426, 69185 Walldorf</p>
        <p><a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a></p>
      </div>
    </div>
  );
}
