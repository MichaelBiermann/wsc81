"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

// ---------------------------------------------------------------------------
// Canvas helper: draw image with rotation, then crop
// ---------------------------------------------------------------------------
async function getCroppedBlob(imageSrc: string, pixelCrop: Area, rotation: number): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  // Determine bounding box of rotated image
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotW = Math.floor(image.width * cos + image.height * sin);
  const rotH = Math.floor(image.width * sin + image.height * cos);

  // Draw rotated image onto intermediate canvas
  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = rotW;
  rotCanvas.height = rotH;
  const rotCtx = rotCanvas.getContext("2d")!;
  rotCtx.translate(rotW / 2, rotH / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  // Crop from the rotated canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = pixelCrop.width;
  outCanvas.height = pixelCrop.height;
  const outCtx = outCanvas.getContext("2d")!;
  outCtx.drawImage(rotCanvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob failed"));
    }, "image/jpeg", 0.92);
  });
}

// ---------------------------------------------------------------------------
// CropModal
// ---------------------------------------------------------------------------
interface CropModalProps {
  src: string;
  aspect?: number;
  onApply: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function CropModal({ src, aspect, onApply, onCancel }: CropModalProps) {
  const { t } = useAdminI18n();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels, rotation);
      onApply(blob);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      {/* Controls bar */}
      <div className="bg-gray-900 px-4 py-3 flex flex-wrap items-center gap-4">
        {/* Zoom */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="material-symbols-rounded text-white text-sm select-none">zoom_in</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#4577ac]"
          />
        </div>

        {/* Rotate */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            className="text-white hover:text-[#4577ac] p-1 transition-colors"
            title={t.imageUpload.rotate}
          >
            <span className="material-symbols-rounded text-xl">rotate_left</span>
          </button>
          <span className="text-white text-xs w-10 text-center">{rotation}°</span>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="text-white hover:text-[#4577ac] p-1 transition-colors"
            title={t.imageUpload.rotate}
          >
            <span className="material-symbols-rounded text-xl">rotate_right</span>
          </button>
        </div>

        {/* Apply / Cancel */}
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {t.imageUpload.cancel}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="px-3 py-1.5 text-sm text-white bg-[#4577ac] hover:bg-[#3a6699] disabled:opacity-50 rounded transition-colors"
          >
            {applying ? t.imageUpload.uploading : t.imageUpload.apply}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminImageUpload
// ---------------------------------------------------------------------------
interface AdminImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  aspect?: number;
}

type Phase = "empty" | "has-image" | "uploading" | "cropping";

export default function AdminImageUpload({ value, onChange, label, required, aspect = 16 / 9 }: AdminImageUploadProps) {
  const { t } = useAdminI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(value ? "has-image" : "empty");
  const [cropSrc, setCropSrc] = useState<string>("");
  const [urlInput, setUrlInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Upload a File blob to Vercel Blob via the admin API
  const uploadBlob = async (blob: Blob): Promise<string> => {
    const fd = new FormData();
    fd.append("file", blob, "image.jpg");
    const res = await fetch("/api/admin/images?mode=file", { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "upload_error");
    }
    const data = await res.json();
    return data.url as string;
  };

  // Proxy a URL through the server to get a Blob CDN URL
  const proxyUrl = async (url: string): Promise<string> => {
    const res = await fetch("/api/admin/images?mode=url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "load_error");
    }
    const data = await res.json();
    return data.url as string;
  };

  const errorLabel = (err: string) => {
    if (err === "invalid_type") return t.imageUpload.invalidType;
    if (err === "too_large") return t.imageUpload.tooLarge;
    if (err === "fetch_failed" || err === "load_error") return t.imageUpload.loadError;
    return t.imageUpload.error;
  };

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    e.target.value = "";
    if (!file) return;

    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) { setErrorMsg(t.imageUpload.invalidType); return; }
    if (file.size > 5 * 1024 * 1024) { setErrorMsg(t.imageUpload.tooLarge); return; }

    setErrorMsg("");
    const localUrl = URL.createObjectURL(file);
    setCropSrc(localUrl);
    setPhase("cropping");
  };

  // Handle URL load
  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setErrorMsg("");
    setPhase("uploading");
    try {
      const proxied = await proxyUrl(urlInput.trim());
      setCropSrc(proxied);
      setPhase("cropping");
    } catch (err) {
      setPhase("empty");
      setErrorMsg(errorLabel((err as Error).message));
    }
  };

  // Handle edit existing image
  const handleEdit = async () => {
    if (!value) return;
    setErrorMsg("");
    // If it's already a Blob CDN URL, open directly; otherwise proxy first
    const isBlobUrl = value.includes(".blob.vercel-storage.com") || value.includes(".public.blob.vercel-storage.com");
    if (isBlobUrl) {
      setCropSrc(value);
      setPhase("cropping");
    } else {
      setPhase("uploading");
      try {
        const proxied = await proxyUrl(value);
        setCropSrc(proxied);
        setPhase("cropping");
      } catch (err) {
        setPhase("has-image");
        setErrorMsg(errorLabel((err as Error).message));
      }
    }
  };

  // After crop modal: upload cropped blob → call onChange
  const handleCropApply = async (blob: Blob) => {
    setPhase("uploading");
    try {
      const url = await uploadBlob(blob);
      onChange(url);
      setPhase("has-image");
      setUrlInput("");
    } catch (err) {
      setPhase(value ? "has-image" : "empty");
      setErrorMsg(errorLabel((err as Error).message));
    }
  };

  const handleCropCancel = () => {
    setPhase(value ? "has-image" : "empty");
  };

  const handleRemove = () => {
    onChange("");
    setUrlInput("");
    setErrorMsg("");
    setPhase("empty");
  };

  return (
    <>
      {phase === "cropping" && (
        <CropModal
          src={cropSrc}
          aspect={aspect}
          onApply={handleCropApply}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        {(phase === "empty" || phase === "uploading") && (
          <div className="flex flex-wrap gap-2 items-center">
            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={phase === "uploading"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-rounded text-base">upload</span>
              {t.imageUpload.uploadFile}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* URL input */}
            <div className="flex flex-1 min-w-48 gap-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlLoad()}
                placeholder="https://..."
                disabled={phase === "uploading"}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4577ac] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleUrlLoad}
                disabled={phase === "uploading" || !urlInput.trim()}
                className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {phase === "uploading" ? (
                  <span className="material-symbols-rounded text-base animate-spin">progress_activity</span>
                ) : (
                  t.imageUpload.load
                )}
              </button>
            </div>
          </div>
        )}

        {phase === "has-image" && (
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="w-48 h-28 object-cover rounded border border-gray-200 bg-gray-50"
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={handleEdit}
                className="text-sm text-[#4577ac] hover:underline text-left"
              >
                {t.imageUpload.editCrop}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-sm text-red-500 hover:underline text-left"
              >
                {t.imageUpload.remove}
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-red-500">{errorMsg}</p>
        )}
      </div>
    </>
  );
}
