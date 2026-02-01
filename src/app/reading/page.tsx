"use client";

import { useState, useEffect, useCallback } from "react";
import { generateReading, textToSpeech } from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VocabularyWord, Word, Conjugation, MasteryByTense } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { convexWordToWord } from "@/lib/convex-helpers";
import { conjugateVerb } from "@/lib/openrouter";
import InteractiveReading from "@/components/InteractiveReading";
import VocabularyFlashcard from "@/components/VocabularyFlashcard";
import AudioPlayer from "@/components/AudioPlayer";

export default function ReadingPage() {
  const [stage, setStage] = useState<"start" | "selecting" | "reading">("start");
  const [selectedLength, setSelectedLength] = useState<"short" | "medium" | "long" | null>(null);
  const [readingText, setReadingText] = useState<string | null>(null);
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([]);
  const [usedWords, setUsedWords] = useState<Word[]>([]);
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [addingWords, setAddingWords] = useState<Set<string>>(new Set());
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  const addWord = useMutation(api.words.add);
  
  // Note: We'll check words individually using queries when needed
  // For now, we'll use a simpler approach - check on add
  const checkWordsInDatabase = useCallback(async () => {
    // This will be handled differently - we'll check when adding words
    // For now, clear added words and let the add process handle it
    setAddedWords(new Set());
    setUsedWords([]);
  }, []);

  const handleStartReading = () => {
    setStage("selecting");
    setError(null);
  };

  const handleLengthSelect = async (length: "short" | "medium" | "long") => {
    setSelectedLength(length);
    setStage("reading");
    setIsLoading(true);
    setError(null);
    setReadingText(null);
    setVocabularyWords([]);
    setUsedWords([]);
    setTranslation(null);
    setSelectedWord(null);
    setAddedWords(new Set());

    try {
      const result = await generateReading(length);
      setReadingText(result.text);
      setVocabularyWords(result.vocabularyWords || []);
      setTranslation(result.translation || null);
      
      // Convert usedWords array to Word objects
      if (result.usedWords && result.usedWords.length > 0) {
        // We'll need to fetch full Word objects, but for now we can use a simplified approach
        // The checkWordsInDatabase will handle this properly
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al generar lectura";
      setError(errorMessage);
      setStage("selecting");
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
        // For verbs, conjugate first
        const verbToConjugate = word.infinitive || word.hebrew;
        try {
          const conjugationResult = await conjugateVerb(verbToConjugate);
          
          if (conjugationResult && conjugationResult.conjugations && conjugationResult.conjugations.length > 0) {
            // Build empty mastery structure
            const mastery = buildEmptyMastery(conjugationResult.conjugations);
            
            // Save with conjugations and mastery
            await addWord({
              hebrew: conjugationResult.infinitive,
              translation: conjugationResult.spanishTranslation,
              conjugations: conjugationResult.conjugations,
              mastery,
            });
          } else {
            // If conjugation failed, save without conjugations
            await addWord({
              hebrew: word.hebrew,
              translation: word.translation,
            });
          }
        } catch (conjugationError) {
          console.warn("Could not conjugate verb, saving without conjugations:", conjugationError);
          // Save word anyway without conjugations
          await addWord({
            hebrew: word.hebrew,
            translation: word.translation,
          });
        }
      } else {
        // For non-verbs, save directly without conjugations
        await addWord({
          hebrew: word.hebrew,
          translation: word.translation,
        });
      }
      
      // Mark as added on success
      setAddedWords(prev => new Set(prev).add(wordKey));
      // Re-check words in database to update usedWords
      await checkWordsInDatabase();
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

  const handleWordClick = (word: VocabularyWord) => {
    setSelectedWord(word);
  };

  const handleCloseWordModal = () => {
    setSelectedWord(null);
  };

  const handlePlayAudio = async () => {
    if (!readingText) return;

    setIsGeneratingAudio(true);
    setAudioError(null);

    // Clean up existing audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const response = await textToSpeech(readingText);
      
      // Create audio from base64
      const audioBlob = Uint8Array.from(atob(response.audioContent), c => c.charCodeAt(0));
      const newAudioUrl = URL.createObjectURL(new Blob([audioBlob], { type: `audio/${response.audioEncoding.toLowerCase()}` }));
      
      setAudioUrl(newAudioUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al generar audio";
      setAudioError(errorMessage);
      console.error("Text-to-speech error:", err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Cleanup audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Clean up audio when reading text changes
  useEffect(() => {
    setAudioUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });
  }, [readingText]);

  // Check words in database when vocabularyWords changes
  useEffect(() => {
    if (vocabularyWords.length > 0) {
      checkWordsInDatabase();
    }
  }, [vocabularyWords, checkWordsInDatabase]);

  const isWordInDatabase = (word: VocabularyWord): boolean => {
    return usedWords.some(w => w.hebrew === word.hebrew);
  };

  const getWordKey = (word: VocabularyWord): string => {
    return `${word.hebrew}-${word.translation}`;
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-feather-text">
        Lectura
      </h1>

      {stage === "start" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-8">📖</div>
          <p className="text-lg font-bold text-feather-text-light mb-8 text-center">
            Practica leyendo en hebreo con textos generados usando tu vocabulario
          </p>
          <Button
            onClick={handleStartReading}
            variant="primary"
            size="lg"
            fullWidth
          >
            Comenzar Lectura
          </Button>
        </div>
      )}

      {stage === "selecting" && (
        <div className="space-y-4">
          <p className="text-center text-lg font-bold text-feather-text-light mb-8">
            Selecciona la longitud de la lectura
          </p>
          <Button
            onClick={() => handleLengthSelect("short")}
            variant="primary"
            size="lg"
            fullWidth
          >
            Corta (50-100 palabras)
          </Button>
          <Button
            onClick={() => handleLengthSelect("medium")}
            variant="primary"
            size="lg"
            fullWidth
          >
            Media (100-200 palabras)
          </Button>
          <Button
            onClick={() => handleLengthSelect("long")}
            variant="primary"
            size="lg"
            fullWidth
          >
            Larga (200-300 palabras)
          </Button>
          <Button
            onClick={() => setStage("start")}
            variant="outline"
            size="md"
            fullWidth
          >
            Volver
          </Button>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">Generando lectura...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {stage === "reading" && !isLoading && readingText && (
        <div className="space-y-6">
          <div className="flex justify-between items-center gap-2">
            <Button
              onClick={() => {
                setStage("selecting");
                setReadingText(null);
                setSelectedWord(null);
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                  setAudioUrl(null);
                }
              }}
              variant="outline"
              size="sm"
            >
              ← Nueva Lectura
            </Button>
            {!audioUrl && (
              <Button
                onClick={handlePlayAudio}
                variant="secondary"
                size="sm"
                disabled={isGeneratingAudio}
              >
                {isGeneratingAudio ? "Generando..." : "🔊 Escuchar"}
              </Button>
            )}
          </div>

          {audioUrl && (
            <div className="mb-4">
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}

          {audioError && (
            <Card className="border-feather-red bg-red-50 text-feather-red">
              <div className="text-sm font-bold">{audioError}</div>
            </Card>
          )}

          <InteractiveReading
            text={readingText}
            vocabularyWords={vocabularyWords}
            usedWords={usedWords}
            onWordClick={handleWordClick}
            selectedWord={selectedWord}
          />

          {translation && (
            <Card className="bg-blue-50 border-feather-blue">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-feather-blue">Traducción</div>
              <div className="text-lg font-bold text-feather-text" dir="ltr">
                {translation}
              </div>
            </Card>
          )}

          {/* Show VocabularyFlashcard modal for selected word */}
          {selectedWord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={handleCloseWordModal}>
              <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
                <VocabularyFlashcard
                  word={selectedWord}
                  onAddToVocabulary={async (word) => {
                    await handleAddToVocabulary(word);
                    // Don't close modal - let user see the updated state
                  }}
                  isAdding={addingWords.has(getWordKey(selectedWord))}
                  isAdded={addedWords.has(getWordKey(selectedWord))}
                />
                <div className="mt-4">
                  <Button
                    onClick={handleCloseWordModal}
                    variant="outline"
                    size="lg"
                    fullWidth
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
