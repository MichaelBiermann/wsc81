import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: React.ReactNode;
}

export default function Select({ error, className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac] ${
        error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
      } ${className}`}
      aria-invalid={error ? "true" : undefined}
      {...props}
    >
      {children}
    </select>
  );
}
