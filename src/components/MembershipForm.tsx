"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Category = "FAMILIE" | "ERWACHSENE" | "JUGENDLICHE" | "SENIOREN" | "GDB";
interface PersonData { name: string; dob: string; }
const FEES: Record<Category, string> = {
  FAMILIE: "€ 47,00", ERWACHSENE: "€ 32,00", JUGENDLICHE: "€ 17,00",
  SENIOREN: "€ 27,00", GDB: "€ 22,00",
};

export default function MembershipForm({ locale }: { locale: string }) {
  const t = useTranslations("Membership");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showIban, setShowIban] = useState(false);
  const [category, setCategory] = useState<Category>("ERWACHSENE");
  const [persons, setPersons] = useState<PersonData[]>([{ name: "", dob: "" }]);
  const [contact, setContact] = useState({ street: "", postalCode: "", city: "", phone: "", email: "" });
  const [bank, setBank] = useState({ bankName: "", iban: "", bic: "" });
  const [consents, setConsents] = useState({ data: false, cancellation: false, bylaws: false });

  const updatePerson = (i: number, field: keyof PersonData, value: string) => {
    setPersons((ps) => { const n = [...ps]; n[i] = { ...n[i], [field]: value }; return n; });
  };
  const addPerson = () => { if (persons.length < 5) setPersons((ps) => [...ps, { name: "", dob: "" }]); };
  const removePerson = (i: number) => { if (i > 0) setPersons((ps) => ps.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consents.data || !consents.cancellation || !consents.bylaws) {
      setStatus("error"); setErrorMsg(locale === "de" ? "Bitte alle Zustimmungen erteilen." : "Please accept all consents."); return;
    }
    setStatus("submitting"); setErrorMsg("");

    const [p1, p2, p3, p4, p5] = persons;
    const body = {
      category,
      person1: p1,
      person2: p2?.name ? p2 : undefined,
      person3: p3?.name ? p3 : undefined,
      person4: p4?.name ? p4 : undefined,
      person5: p5?.name ? p5 : undefined,
      ...contact,
      ...bank,
      consentData: consents.data,
      consentCancellation: consents.cancellation,
      consentBylaws: consents.bylaws,
      locale,
    };

    const res = await fetch("/api/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/${locale}/membership/success`);
    } else {
      const data = await res.json();
      setStatus("error");
      setErrorMsg(data.errors ? Object.values(data.errors).flat().join(", ") : t("errors.generic"));
    }
  };

  const personLabels = [t("persons.person1"), t("persons.person2"), t("persons.person3"), t("persons.person4"), t("persons.person5")];
  const categories: Category[] = ["FAMILIE", "ERWACHSENE", "JUGENDLICHE", "SENIOREN", "GDB"];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Category */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-800 mb-3">{t("categories.title")}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((cat) => (
            <label key={cat} className={`flex items-center justify-between rounded border p-3 cursor-pointer transition-colors ${category === cat ? "border-[#4577ac] bg-[#eef3f9]" : "border-gray-200"}`}>
              <div className="flex items-center gap-2">
                <input type="radio" name="category" value={cat} checked={category === cat} onChange={() => setCategory(cat)} className="accent-[#4577ac]" />
                <span className="text-sm">{t(`categories.${cat}` as Parameters<typeof t>[0])}</span>
              </div>
              <span className="text-sm font-semibold text-[#4577ac]">{FEES[cat]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Persons */}
      {persons.map((person, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{personLabels[i]}</h3>
            {i > 0 && <button type="button" onClick={() => removePerson(i)} className="text-xs text-red-500 hover:text-red-700">{t("persons.removePerson")}</button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={t("fields.name")} required={i === 0}>
              <Input value={person.name} onChange={(e) => updatePerson(i, "name", e.target.value)} required={i === 0} />
            </FormField>
            <FormField label={t("fields.dob")} required={i === 0}>
              <Input type="date" value={person.dob} onChange={(e) => updatePerson(i, "dob", e.target.value)} required={i === 0} />
            </FormField>
          </div>
        </div>
      ))}
      {persons.length < 5 && (
        <button type="button" onClick={addPerson} className="self-start text-sm text-[#4577ac] hover:underline">+ {t("persons.addPerson")}</button>
      )}

      {/* Contact */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Kontakt</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("fields.street")} required>
            <Input value={contact.street} onChange={(e) => setContact((c) => ({ ...c, street: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.postalCode")} required>
            <Input value={contact.postalCode} onChange={(e) => setContact((c) => ({ ...c, postalCode: e.target.value }))} pattern="\d{5}" required />
          </FormField>
          <FormField label={t("fields.city")} required>
            <Input value={contact.city} onChange={(e) => setContact((c) => ({ ...c, city: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.phone")} required>
            <Input type="tel" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} required />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t("fields.email")} required>
              <Input type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} required />
            </FormField>
          </div>
        </div>
      </div>

      {/* Bank details */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Bankverbindung (SEPA)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label={t("fields.bankName")} required>
              <Input value={bank.bankName} onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))} required />
            </FormField>
          </div>
          <FormField label={t("fields.iban")} hint={t("fields.ibanHint")} required>
            <div className="relative">
              <Input type={showIban ? "text" : "password"} value={bank.iban} onChange={(e) => setBank((b) => ({ ...b, iban: e.target.value.toUpperCase() }))} required className="w-full pr-20" />
              <button type="button" onClick={() => setShowIban(!showIban)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#4577ac] hover:underline">
                {showIban ? t("fields.hideIban") : t("fields.showIban")}
              </button>
            </div>
          </FormField>
          <FormField label={t("fields.bic")} required>
            <Input value={bank.bic} onChange={(e) => setBank((b) => ({ ...b, bic: e.target.value.toUpperCase() }))} required />
          </FormField>
        </div>
      </div>

      {/* Consents */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3">
        <h3 className="font-semibold text-gray-800">Zustimmungen</h3>
        {(["data", "cancellation", "bylaws"] as const).map((key) => (
          <label key={key} className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={consents[key]}
              onChange={(e) => setConsents((c) => ({ ...c, [key]: e.target.checked }))}
              className="mt-0.5 w-4 h-4 accent-[#4577ac]"
              required
            />
            <span>{t(`consents.${key}` as Parameters<typeof t>[0])}</span>
          </label>
        ))}
        <p className="text-xs text-gray-400">{t("fiscalYear")}</p>
      </div>

      {status === "error" && <Alert variant="error">{errorMsg}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
