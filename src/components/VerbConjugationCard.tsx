"use client";

import { useState } from "react";
import { Conjugation } from "@/lib/types";
import ConjugationByTense from "./ConjugationByTense";
import { conjugateVerb } from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface VerbConjugationCardProps {
  verb: string;
  spanishTranslation?: string | null;
  conjugations?: Conjugation[] | null;
}

export default function VerbConjugationCard({ 
  verb, 
  spanishTranslation: initialSpanishTranslation,
  conjugations: initialConjugations 
}: VerbConjugationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conjugations, setConjugations] = useState<Conjugation[]>(initialConjugations || []);
  const [spanishTranslation, setSpanishTranslation] = useState<string | null>(initialSpanishTranslation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use provided conjugations if available, otherwise use state
  const displayConjugations = initialConjugations || conjugations;
  const hasConjugations = displayConjugations && displayConjugations.length > 0;

  const handleToggle = async () => {
    if (!isOpen && !hasConjugations && !isLoading) {
      // Only fetch if conjugations weren't provided as props
      setIsLoading(true);
      setError(null);
      try {
        const result = await conjugateVerb(verb);
        setConjugations(result.conjugations);
        setSpanishTranslation(result.spanishTranslation);
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
    <Card className="mt-6 overflow-hidden p-0 border-0">
      <Button
        variant="ghost"
        fullWidth
        onClick={handleToggle}
        className="rounded-none border-b border-feather-gray bg-blue-50 hover:bg-blue-100 h-auto py-4"
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-extrabold uppercase tracking-wide text-feather-blue">
            {isOpen ? "Hide" : "Show"} Conjugation
          </span>
          <svg
            className={`h-6 w-6 text-feather-blue transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </Button>

      {isOpen && (
        <div className="p-4 bg-white">
          {isLoading && (
            <div className="py-8 text-center">
              <div className="mb-4 text-sm font-bold text-feather-text-light">Loading conjugations...</div>
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border-2 border-feather-red bg-red-50 px-4 py-3">
              <div className="text-sm font-bold text-feather-red">{error}</div>
            </div>
          )}

          {!isLoading && !error && hasConjugations && (
            <ConjugationByTense conjugations={displayConjugations!} />
          )}
        </div>
      )}
    </Card>
  );
}
