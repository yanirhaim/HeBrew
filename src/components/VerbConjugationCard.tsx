"use client";

import { useState } from "react";
import { Conjugation } from "@/lib/types";
import ConjugationByTense from "./ConjugationByTense";
import { conjugateVerb } from "@/lib/openrouter";

interface VerbConjugationCardProps {
  verb: string;
}

export default function VerbConjugationCard({ verb }: VerbConjugationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conjugations, setConjugations] = useState<Conjugation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!isOpen && conjugations.length === 0 && !isLoading) {
      // Fetch conjugations when opening for the first time
      setIsLoading(true);
      setError(null);
      try {
        const result = await conjugateVerb(verb);
        setConjugations(result.conjugations);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load conjugations";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-white overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">
          {isOpen ? "Hide" : "Show"} Conjugation
        </span>
        <svg
          className={`w-5 h-5 text-slate-600 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4">
          {isLoading && (
            <div className="py-8 text-center">
              <div className="mb-2 text-sm text-slate-500">Loading conjugations...</div>
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          )}

          {!isLoading && !error && conjugations.length > 0 && (
            <ConjugationByTense conjugations={conjugations} />
          )}
        </div>
      )}
    </div>
  );
}
