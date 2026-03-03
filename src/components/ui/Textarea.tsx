import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export default function Textarea({ error, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      rows={4}
      className={`rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac] resize-vertical ${
        error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
      } ${className}`}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}
