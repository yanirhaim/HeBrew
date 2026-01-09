"use client";

import { useState } from "react";
import HebrewInput from "@/components/HebrewInput";
import VerbConjugationCard from "@/components/VerbConjugationCard";
import { translateText } from "@/lib/openrouter";

export default function TranslationPage() {
  const [inputValue, setInputValue] = useState("");
  const [translation, setTranslation] = useState("");
  const [direction, setDirection] = useState<"he-to-en" | "en-to-he">("he-to-en");
  const [isVerb, setIsVerb] = useState(false);
  const [verbForm, setVerbForm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setTranslation("");
      setIsVerb(false);
      setVerbForm(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateText(inputValue.trim(), direction);
      setTranslation(result.translation);
      setIsVerb(result.isVerb);
      setVerbForm(result.verbForm);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to translate text";
      setError(errorMessage);
      setTranslation("");
      setIsVerb(false);
      setVerbForm(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-4 pb-24 pt-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Translation
      </h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setDirection("he-to-en")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            direction === "he-to-en"
              ? "bg-blue-500 text-white"
              : "bg-blue-50 text-slate-600"
          }`}
        >
          Hebrew → English
        </button>
        <button
          onClick={() => setDirection("en-to-he")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            direction === "en-to-he"
              ? "bg-blue-500 text-white"
              : "bg-blue-50 text-slate-600"
          }`}
        >
          English → Hebrew
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <HebrewInput
          label={direction === "he-to-en" ? "Enter Hebrew text" : "Enter English text"}
          placeholder={direction === "he-to-en" ? "שלום" : "Hello"}
          dir={direction === "he-to-en" ? "rtl" : "ltr"}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!e.target.value.trim()) {
              setTranslation("");
            }
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Translating..." : "Translate"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}

      {isLoading && (
        <div className="py-8 text-center">
          <div className="mb-2 text-sm text-slate-500">Translating...</div>
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {!isLoading && translation && (
        <div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="mb-2 text-sm text-slate-500">Translation:</div>
            <div
              className="text-lg font-medium text-slate-800"
              dir={direction === "he-to-en" ? "ltr" : "rtl"}
            >
              {translation}
            </div>
          </div>

          {isVerb && verbForm && (
            <VerbConjugationCard verb={verbForm} />
          )}
        </div>
      )}

      {!isLoading && inputValue.trim() && !translation && !error && (
        <div className="py-8 text-center text-sm text-slate-400">
          Click "Translate" to see results
        </div>
      )}
    </div>
  );
}
