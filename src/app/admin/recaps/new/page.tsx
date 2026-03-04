import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import RecapForm from "../RecapForm";

export default function NewRecapPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neuer Rückblick</h1>
      <RecapForm />
    </div>
  );
}
