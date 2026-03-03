import ContentForm from "../../ContentForm";

export default function NewNewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neue Neuigkeit</h1>
      <ContentForm type="news" />
    </div>
  );
}
