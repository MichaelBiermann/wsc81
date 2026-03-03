"use client";

import EventForm from "../EventForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function NewEventPage() {
  const { t } = useAdminI18n();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.events.newEvent}</h1>
      <EventForm />
    </div>
  );
}
