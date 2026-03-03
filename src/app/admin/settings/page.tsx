"use client";

import { useState, useEffect } from "react";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    bankName: "", iban: "", bic: "",
    feeCollectionDay: "1", feeCollectionMonth: "10",
  });
  const [ibanMasked, setIbanMasked] = useState("");
  const [showIban, setShowIban] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((data) => {
      if (data) {
        setForm({
          bankName: data.bankName ?? "",
          iban: "",
          bic: data.bic ?? "",
          feeCollectionDay: String(data.feeCollectionDay ?? 1),
          feeCollectionMonth: String(data.feeCollectionMonth ?? 10),
        });
        setIbanMasked(data.ibanMasked ?? "");
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving"); setError("");
    const body = { ...form, feeCollectionDay: Number(form.feeCollectionDay), feeCollectionMonth: Number(form.feeCollectionMonth) };
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { const data = await res.json(); setIbanMasked(data.ibanMasked ?? ""); setForm((f) => ({ ...f, iban: "" })); setStatus("success"); }
    else { setStatus("error"); setError("Fehler beim Speichern."); }
  };

  const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Club-Einstellungen</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-5 max-w-lg">

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Bankverbindung WSC 81</h2>
          <div className="flex flex-col gap-3">
            <FormField label="Kreditinstitut">
              <Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
            </FormField>
            <FormField label="IBAN" hint={ibanMasked ? `Aktuell gespeichert: ${ibanMasked}` : undefined}>
              <div className="relative">
                <Input
                  type={showIban ? "text" : "password"}
                  value={form.iban}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value.toUpperCase() }))}
                  placeholder={ibanMasked ? "Neue IBAN eingeben zum Ändern" : "DE00 0000..."}
                  className="w-full pr-20"
                />
                <button type="button" onClick={() => setShowIban(!showIban)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#4577ac] hover:underline">
                  {showIban ? "Verbergen" : "Anzeigen"}
                </button>
              </div>
            </FormField>
            <FormField label="BIC">
              <Input value={form.bic} onChange={(e) => setForm((f) => ({ ...f, bic: e.target.value.toUpperCase() }))} />
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Jahresbeitrag-Einzug (SEPA)</h2>
          <p className="text-sm text-gray-500 mb-3">Tag und Monat für den automatischen Einzug des Jahresbeitrags.</p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tag (1–28)">
              <Input type="number" min="1" max="28" value={form.feeCollectionDay} onChange={(e) => setForm((f) => ({ ...f, feeCollectionDay: e.target.value }))} />
            </FormField>
            <FormField label="Monat">
              <select
                value={form.feeCollectionMonth}
                onChange={(e) => setForm((f) => ({ ...f, feeCollectionMonth: e.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </FormField>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Einzug am {form.feeCollectionDay}. {MONTHS[Number(form.feeCollectionMonth) - 1]} jedes Jahr.
          </p>
        </div>

        {status === "error" && <Alert variant="error">{error}</Alert>}
        {status === "success" && <Alert variant="success">Einstellungen gespeichert.</Alert>}

        <Button type="submit" loading={status === "saving"}>Speichern</Button>
      </form>
    </div>
  );
}
