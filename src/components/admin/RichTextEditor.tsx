"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useState } from "react";

type AIAction = "rephrase" | "shorten" | "expand" | "fix_grammar" | "translate";

const AI_ACTIONS: { key: AIAction; label: string }[] = [
  { key: "rephrase", label: "Umformulieren" },
  { key: "shorten", label: "Kürzen" },
  { key: "expand", label: "Erweitern" },
  { key: "fix_grammar", label: "Grammatik korrigieren" },
  { key: "translate", label: "Übersetzen DE↔EN" },
];

export default function RichTextEditor({
  content,
  onChange,
  locale = "de",
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  locale?: string;
  placeholder?: string;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSelection, setAiSelection] = useState<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: placeholder ?? "Text eingeben..." }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    onSelectionUpdate() {
      // no-op — we read selection directly at action time
    },
  });

  const runAI = async (action: AIAction) => {
    if (!editor) return;
    // Read selection directly from editor state at click time (before focus changes)
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    const text = hasSelection
      ? editor.state.doc.textBetween(from, to)
      : editor.getText();
    if (!text.trim()) return;

    // Remember where to insert the result
    setAiSelection(hasSelection ? { from, to } : null);
    setAiLoading(true);
    setAiSuggestion(null);

    const res = await fetch("/api/admin/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, action, locale }),
    });

    const data = await res.json();
    setAiLoading(false);
    if (data.suggestion) setAiSuggestion(data.suggestion);
  };

  const acceptSuggestion = () => {
    if (!aiSuggestion || !editor) return;
    if (aiSelection) {
      // Replace the specific selection range
      editor
        .chain()
        .focus()
        .deleteRange(aiSelection)
        .insertContentAt(aiSelection.from, aiSuggestion)
        .run();
    } else {
      // Replace entire document — wrap plain text in paragraph tags so TipTap parses it correctly
      const html = aiSuggestion
        .split(/\n{2,}/)
        .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
        .join("");
      editor.chain().focus().setContent(html).run();
    }
    onChange(editor.getHTML());
    setAiSuggestion(null);
    setAiSelection(null);
  };

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Fett">B</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Kursiv"><em>I</em></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Unterstrichen"><u>U</u></ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Überschrift">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Unterüberschrift">H3</ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste">• Liste</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Nummeriert">1. Liste</ToolBtn>
        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* AI actions */}
        <div className="flex items-center gap-1 ml-1">
          <span className="text-xs text-purple-600 font-medium">✨ KI:</span>
          {AI_ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              disabled={aiLoading}
              onClick={() => runAI(a.key)}
              className="rounded px-2 py-0.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
              title={a.label}
            >
              {a.label}
            </button>
          ))}
          {aiLoading && <span className="text-xs text-gray-400 ml-1">…</span>}
        </div>
      </div>

      {/* AI suggestion banner */}
      {aiSuggestion && (
        <div className="bg-purple-50 border-b border-purple-200 p-3 text-sm">
          <p className="text-purple-800 font-medium mb-2">✨ KI-Vorschlag:</p>
          <p className="text-gray-700 whitespace-pre-wrap mb-3 bg-white rounded border border-purple-200 p-2">{aiSuggestion}</p>
          <div className="flex gap-2">
            <button type="button" onClick={acceptSuggestion} className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700">Übernehmen</button>
            <button type="button" onClick={() => setAiSuggestion(null)} className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">Verwerfen</button>
          </div>
        </div>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[160px] focus-within:outline-none"
      />
    </div>
  );
}

function ToolBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${active ? "bg-[#4577ac] text-white" : "text-gray-700 hover:bg-gray-200"}`}
    >
      {children}
    </button>
  );
}
