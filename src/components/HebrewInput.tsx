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
        <label className="mb-2 block text-sm font-bold text-feather-text uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        type="text"
        dir={dir}
        className={`w-full rounded-2xl border-2 border-feather-gray bg-feather-gray/10 px-4 py-3 text-lg font-bold text-feather-text placeholder-feather-text-light transition-all focus:border-feather-blue focus:bg-white focus:outline-none ${
          dir === "rtl" ? "text-right" : "text-left"
        } ${className}`}
        {...props}
      />
    </div>
  );
}
