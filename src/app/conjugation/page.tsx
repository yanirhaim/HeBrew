"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HebrewInput from "@/components/HebrewInput";
import ConjugationByTense from "@/components/ConjugationByTense";
import { Conjugation, MasteryByTense } from "@/lib/types";
import { cachePracticePayload, fetchConjugationAndPractice } from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";

export default function ConjugationPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [conjugations, setConjugations] = useState<Conjugation[]>([]);
  const [spanishTranslation, setSpanishTranslation] = useState("");
  const [canonicalVerb, setCanonicalVerb] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addWord = useMutation(api.words.add);

  const normalizePronounCode = (conjugation: Conjugation, fallbackIndex: number) => {
    if (conjugation.pronounCode) return conjugation.pronounCode;
    return (
      conjugation.pronoun
        ?.toLowerCase()
        ?.replace(/[^a-z0-9]+/gi, "_")
        ?.replace(/^_+|_+$/g, "") || `p_${fallbackIndex}`
    );
  };

  const buildEmptyMastery = (items: Conjugation[]): MasteryByTense => {
    const base: Record<string, number> = {};
    items.forEach((item, idx) => {
      const code = normalizePronounCode(item, idx);
      base[code] = 0;
    });
    return {
      past: { ...base },
      present: { ...base },
      future: { ...base },
    };
  };

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
      const trimmed = inputValue.trim();
      const { conjugation, practice } = await fetchConjugationAndPractice(trimmed);

      setConjugations(conjugation.conjugations);
      setSpanishTranslation(conjugation.spanishTranslation);
      setCanonicalVerb(conjugation.infinitive);
      // Cache practice payload also under the canonical verb key
      cachePracticePayload(conjugation.infinitive, practice);


      // Save verb immediately with conjugations + zeroed mastery
      const mastery = buildEmptyMastery(conjugation.conjugations);
      const wordId = await addWord({
        hebrew: conjugation.infinitive,
        translation: conjugation.spanishTranslation,
        conjugations: conjugation.conjugations,
        mastery,
      });

      // Cache practice payload and word metadata for the practice page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `word-meta:${conjugation.infinitive}`,
          JSON.stringify({
            wordId,
            translation: conjugation.spanishTranslation,
            mastery,
          })
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al conjugar el verbo";
      setError(errorMessage);
      setConjugations([]);
      setSpanishTranslation("");
      setCanonicalVerb("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Conjugación
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <HebrewInput
          label="Ingresa verbo en hebreo"
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
          {isLoading ? "Conjugando..." : "Conjugar"}
        </Button>
      </form>

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">Conjugando verbo...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {!isLoading && conjugations.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {spanishTranslation && (
            <div className="mb-8 space-y-4">
              <Card className="bg-blue-50 border-feather-blue">
                <div className="mb-1 text-xs font-bold uppercase tracking-wide text-feather-blue">Traducción</div>
                <div className="text-xl font-bold text-feather-text">{spanishTranslation}</div>
              </Card>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  const verbToPractice = canonicalVerb || inputValue.trim();
                  router.push(`/practice/${encodeURIComponent(verbToPractice)}`);
                }}
              >
                EMPEZAR A PRACTICAR
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
            ¡Ingresa un verbo para ver la magia!
           </p>
        </div>
      )}
    </div>
  );
}
