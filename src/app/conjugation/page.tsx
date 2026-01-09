"use client";

import { useState } from "react";
import HebrewInput from "@/components/HebrewInput";
import ConjugationByTense from "@/components/ConjugationByTense";
import { Conjugation } from "@/lib/types";
import { conjugateVerb } from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-32 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Conjugation
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
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
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? "Conjugating..." : "Conjugate"}
        </Button>
      </form>

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">Conjugating verb...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {!isLoading && conjugations.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {spanishTranslation && (
            <div className="mb-8 space-y-4">
              <Card className="bg-blue-50 border-feather-blue">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-feather-blue">Translation</div>
                <div className="text-xl font-bold text-feather-text">{spanishTranslation}</div>
              </Card>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  // TODO: Implement start practicing functionality
                  console.log("Start practicing:", inputValue, spanishTranslation);
                }}
              >
                START PRACTICING
              </Button>
            </div>
          )}
          <ConjugationByTense conjugations={conjugations} />
        </div>
      )}

      {!isLoading && inputValue.trim() && conjugations.length === 0 && !error && (
        <div className="mt-12 text-center">
           <div className="text-6xl mb-4">🤔</div>
           <p className="text-lg font-bold text-feather-text-light">
            Enter a verb to see magic happen!
           </p>
        </div>
      )}
    </div>
  );
}
