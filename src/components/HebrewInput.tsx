"use client";

import { InputHTMLAttributes } from "react";

interface HebrewInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function HebrewInput({
  label,
  className = "",
  dir = "rtl",
  ...props
}: HebrewInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        type="text"
        dir={dir}
        className={`w-full rounded-lg border border-blue-100 bg-white px-4 py-3 text-lg text-slate-800 placeholder-slate-400 transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          dir === "rtl" ? "text-right" : "text-left"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
