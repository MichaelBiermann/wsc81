import ContentForm from "../../ContentForm";

export default function NewPagePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neue Seite</h1>
      <ContentForm type="pages" />
    </div>
  );
}
