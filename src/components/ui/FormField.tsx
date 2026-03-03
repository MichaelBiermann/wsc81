import React from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export default function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
      {error && <span className="text-xs text-red-600" role="alert">{error}</span>}
    </div>
  );
}
