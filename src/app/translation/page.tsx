"use client";

import { useState, useEffect, useCallback } from "react";
import HebrewInput from "@/components/HebrewInput";
import VocabularyFlashcard from "@/components/VocabularyFlashcard";
import { translateText, conjugateVerb } from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VocabularyWord, Conjugation, MasteryByTense } from "@/lib/types";
import { addWord, findWordByHebrew } from "@/lib/firestore";

export default function TranslationPage() {
  const [inputValue, setInputValue] = useState("");
  const [translation, setTranslation] = useState("");
  const [direction, setDirection] = useState<"he-to-es" | "es-to-he">("he-to-es");
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingWords, setAddingWords] = useState<Set<string>>(new Set()); // Track words being added (loading)
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set()); // Track words already in database

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

  const checkWordsInDatabase = useCallback(async () => {
    if (vocabularyWords.length === 0) return;

    const wordsToCheck = vocabularyWords.map((word) => ({
      word,
      key: `${word.hebrew}-${word.translation}`,
    }));

    const checkPromises = wordsToCheck.map(async ({ word, key }) => {
      const found = await findWordByHebrew(word.hebrew);
      return { key, exists: found !== null };
    });

    const results = await Promise.all(checkPromises);
    
    const existingKeys = new Set(
      results.filter((r) => r.exists).map((r) => r.key)
    );
    
    setAddedWords(existingKeys);
  }, [vocabularyWords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!inputValue.trim()) {
      setTranslation("");
      setVocabularyWords([]);
      setAddedWords(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const result = await translateText(inputValue.trim(), direction);
      setTranslation(result.translation);
      setVocabularyWords(result.vocabularyWords || []);
      // Reset added words - will be checked in useEffect
      setAddedWords(new Set());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al traducir el texto";
      setError(errorMessage);
      setTranslation("");
      setVocabularyWords([]);
      setAddedWords(new Set());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToVocabulary = async (word: VocabularyWord) => {
    const wordKey = `${word.hebrew}-${word.translation}`;
    
    // Prevent duplicate additions
    if (addingWords.has(wordKey) || addedWords.has(wordKey)) {
      return;
    }

    setAddingWords(prev => new Set(prev).add(wordKey));
    
    try {
      if (word.wordType === "verb") {
        // ONLY FOR VERBS: Conjugate first, then save with conjugations and mastery
        const verbToConjugate = word.infinitive || word.hebrew;
        try {
          const conjugationResult = await conjugateVerb(verbToConjugate);
          
          if (conjugationResult && conjugationResult.conjugations && conjugationResult.conjugations.length > 0) {
            // Build empty mastery structure for all pronouns
            const mastery = buildEmptyMastery(conjugationResult.conjugations);
            
            // Save verb with conjugations and mastery
            await addWord(
              conjugationResult.infinitive,
              conjugationResult.spanishTranslation,
              conjugationResult.conjugations,
              mastery
            );
          } else {
            // If conjugation failed, save verb without conjugations as fallback
            await addWord(word.hebrew, word.translation, undefined);
          }
        } catch (conjugationError) {
          console.warn("Could not conjugate verb, saving without conjugations:", conjugationError);
          // Save verb anyway without conjugations if conjugation fails
          await addWord(word.hebrew, word.translation, undefined);
        }
      } else {
        // FOR NON-VERBS (noun, adjective, adverb, other): Save directly without conjugations
        // We do NOT conjugate nouns, adjectives, adverbs, or other word types
        await addWord(word.hebrew, word.translation, undefined);
      }
      
      // Mark as added on success
      setAddedWords(prev => new Set(prev).add(wordKey));
    } catch (err) {
      console.error("Failed to add word to vocabulary:", err);
      setError("Error al agregar palabra al vocabulario");
    } finally {
      // Remove from loading state
      setAddingWords(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordKey);
        return newSet;
      });
    }
  };

  // Check words in database when vocabularyWords changes
  useEffect(() => {
    if (vocabularyWords.length > 0) {
      checkWordsInDatabase();
    }
  }, [vocabularyWords, checkWordsInDatabase]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Traducción
      </h1>

      <div className="mb-6 flex gap-3">
        <Button
          onClick={() => setDirection("he-to-es")}
          variant={direction === "he-to-es" ? "primary" : "outline"}
          className="flex-1"
          size="sm"
        >
          Hebreo → Español
        </Button>
        <Button
          onClick={() => setDirection("es-to-he")}
          variant={direction === "es-to-he" ? "primary" : "outline"}
          className="flex-1"
          size="sm"
        >
          Español → Hebreo
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <HebrewInput
          label={direction === "he-to-es" ? "Ingresa texto en hebreo" : "Ingresa texto en español"}
          placeholder={direction === "he-to-es" ? "שלום" : "Hola"}
          dir={direction === "he-to-es" ? "rtl" : "ltr"}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!e.target.value.trim()) {
              setTranslation("");
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
          {isLoading ? "Traduciendo..." : "Traducir"}
        </Button>
      </form>

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">Traduciendo...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {!isLoading && translation && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="mb-4 bg-blue-50 border-feather-blue">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-feather-blue">Traducción</div>
            <div
              className="text-xl font-bold text-feather-text"
              dir={direction === "he-to-es" ? "ltr" : "rtl"}
            >
              {translation}
            </div>
          </Card>

          {vocabularyWords.length > 0 ? (
            <div className="space-y-4">
              {vocabularyWords.map((word, index) => {
                const wordKey = `${word.hebrew}-${word.translation}`;
                return (
                  <VocabularyFlashcard
                    key={index}
                    word={word}
                    onAddToVocabulary={handleAddToVocabulary}
                    isAdding={addingWords.has(wordKey)}
                    isAdded={addedWords.has(wordKey)}
                  />
                );
              })}
            </div>
          ) : (
            <Card className="mt-4 p-6 text-center">
              <div className="text-sm font-bold text-feather-text-light">
                No se encontraron palabras de vocabulario para mostrar
              </div>
            </Card>
          )}
        </div>
      )}

      {!isLoading && inputValue.trim() && !translation && !error && (
        <div className="mt-12 text-center">
           <div className="text-6xl mb-4">🌍</div>
           <p className="text-lg font-bold text-feather-text-light">
            ¡Listo para traducir!
           </p>
        </div>
      )}
    </div>
  );
}
