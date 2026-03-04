"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  /** Current avatar URL (null = none set) */
  currentUrl?: string | null;
  /** Called after a successful upload with the new URL */
  onUploaded?: (url: string) => void;
  /** Called after a successful delete */
  onDeleted?: () => void;
  /** When true, upload goes to the live API endpoint (requires session).
   *  When false (register flow), just calls onUploaded with a local preview URL
   *  and stores the File for the parent to submit. */
  liveUpload?: boolean;
  /** In local mode, called with the raw File so the parent can include it */
  onFileSelected?: (file: File) => void;
  labels: {
    upload: string;
    change: string;
    remove: string;
    invalidType: string;
    tooLarge: string;
    error: string;
  };
}

export default function AvatarUpload({
  currentUrl,
  onUploaded,
  onDeleted,
  liveUpload = true,
  onFileSelected,
  labels,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { setError(labels.invalidType); return; }
    if (file.size > 2 * 1024 * 1024) { setError(labels.tooLarge); return; }

    // Always show a local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (!liveUpload) {
      onFileSelected?.(file);
      onUploaded?.(objectUrl);
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error === "invalid_type" ? labels.invalidType : d.error === "too_large" ? labels.tooLarge : labels.error);
      setPreview(currentUrl ?? null);
      return;
    }
    const { avatarUrl } = await res.json();
    setPreview(avatarUrl);
    onUploaded?.(avatarUrl);
  };

  const handleRemove = async () => {
    setError("");
    if (liveUpload) {
      setUploading(true);
      await fetch("/api/user/avatar", { method: "DELETE" });
      setUploading(false);
    }
    setPreview(null);
    onDeleted?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      {/* Avatar circle */}
      <div
        className="relative w-16 h-16 rounded-full bg-[#eef3f9] border-2 border-[#4577ac]/30 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
        onClick={() => inputRef.current?.click()}
        title={preview ? labels.change : labels.upload}
      >
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
        ) : (
          <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 32 }}>person</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#4577ac] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-[#4577ac] hover:underline disabled:opacity-50"
        >
          {preview ? labels.change : labels.upload}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            {labels.remove}
          </button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
