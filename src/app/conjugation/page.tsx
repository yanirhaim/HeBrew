"use client";

import { useState } from "react";
import HebrewInput from "@/components/HebrewInput";
import ConjugationByTense from "@/components/ConjugationByTense";
import { Conjugation } from "@/lib/types";
import { conjugateVerb } from "@/lib/openrouter";

export default function ConjugationPage() {
  const [inputValue, setInputValue] = useState("");
  const [conjugations, setConjugations] = useState<Conjugation[]>([]);
  const [spanishTranslation, setSpanishTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setConjugations([]);
      setSpanishTranslation("");
      return;
    }

    setIsLoading(true);
    try {
      const result = await conjugateVerb(inputValue.trim());
      setConjugations(result.conjugations);
      setSpanishTranslation(result.spanishTranslation);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to conjugate verb";
      setError(errorMessage);
      setConjugations([]);
      setSpanishTranslation("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-4 pb-24 pt-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">
        Conjugation
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <HebrewInput
          label="Enter Hebrew verb"
          placeholder="כתב"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!e.target.value.trim()) {
              setConjugations([]);
            }
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Conjugating..." : "Conjugate"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}

      {isLoading && (
        <div className="py-8 text-center">
          <div className="mb-2 text-sm text-slate-500">Conjugating verb...</div>
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {!isLoading && conjugations.length > 0 && (
        <div>
          {spanishTranslation && (
            <div className="mb-6">
              <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="text-sm text-slate-500">Spanish Translation:</div>
                <div className="text-lg font-semibold text-slate-800">{spanishTranslation}</div>
              </div>
              <button
                onClick={() => {
                  // TODO: Implement add to dictionary functionality
                  console.log("Add to dictionary:", inputValue, spanishTranslation);
                }}
                className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
              >
                Agregar a diccionario
              </button>
            </div>
          )}
          <ConjugationByTense conjugations={conjugations} />
        </div>
      )}

      {!isLoading && inputValue.trim() && conjugations.length === 0 && !error && (
        <div className="py-8 text-center text-sm text-slate-400">
          Click "Conjugate" to see results
        </div>
      )}
    </div>
  );
}
