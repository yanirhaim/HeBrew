"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  summarizeNewsItem,
  cacheDailyNewsPayload,
  readCachedDailyNewsPayload,
  textToSpeech,
  NewsListItem,
} from "@/lib/openrouter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Conjugation, MasteryByTense, VocabularyWord } from "@/lib/types";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { conjugateVerb } from "@/lib/openrouter";
import InteractiveReading from "@/components/InteractiveReading";
import VocabularyFlashcard from "@/components/VocabularyFlashcard";
import AudioPlayer from "@/components/AudioPlayer";

export default function NewsItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [headline, setHeadline] = useState<string | null>(null);
  const [headlineTranslation, setHeadlineTranslation] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>([]);
  const [usedWords, setUsedWords] = useState<Array<{ hebrew: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [addingWords, setAddingWords] = useState<Set<string>>(new Set());
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  const checkWordsInDatabase = useCallback(async () => {
    setAddedWords(new Set());
    setUsedWords([]);
  }, []);

  const item: NewsListItem | null = useMemo(() => {
    const title = searchParams.get("title");
    const link = searchParams.get("link");
    if (!title || !link) return null;
    return {
      title,
      link,
      pubDate: searchParams.get("pubDate") || undefined,
      description: searchParams.get("description") || undefined,
    };
  }, [searchParams]);

  const loadSummary = useCallback(async (newsItem: NewsListItem) => {
    setError(null);
    setIsLoading(true);
    setHeadline(null);
    setHeadlineTranslation(null);
    setSummary(null);
    setTranslation(null);
    setVocabularyWords([]);
    setUsedWords([]);
    setSelectedWord(null);
    setAudioError(null);
    setAudioUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });

    const cacheKey = newsItem.link || newsItem.title;
    const cached = readCachedDailyNewsPayload(cacheKey);
    if (cached) {
      setHeadline(cached.headline);
      setHeadlineTranslation(cached.headlineTranslation || null);
      setSummary(cached.summary);
      setTranslation(cached.translation || null);
      setVocabularyWords(cached.vocabularyWords || []);
      setUsedWords((cached.usedWords || []) as Array<{ hebrew: string }>);
      setIsLoading(false);
      return;
    }

    try {
      const result = await summarizeNewsItem(newsItem);
      setHeadline(result.headline);
      setHeadlineTranslation(result.headlineTranslation || null);
      setSummary(result.summary);
      setTranslation(result.translation || null);
      setVocabularyWords(result.vocabularyWords || []);
      setUsedWords((result.usedWords || []) as Array<{ hebrew: string }>);
      cacheDailyNewsPayload(result, cacheKey);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al resumir noticia";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (item) {
      loadSummary(item);
    } else {
      setError("No se encontró la noticia");
    }
  }, [item, loadSummary]);

  useEffect(() => {
    if (vocabularyWords.length > 0) {
      checkWordsInDatabase();
    }
  }, [vocabularyWords, checkWordsInDatabase]);

  const handleAddToVocabulary = async (word: VocabularyWord) => {
    const wordKey = `${word.hebrew}-${word.translation}`;

    if (addingWords.has(wordKey) || addedWords.has(wordKey)) {
      return;
    }

    setAddingWords((prev) => new Set(prev).add(wordKey));

    try {
      if (word.wordType === "verb") {
        const verbToConjugate = word.infinitive || word.hebrew;
        try {
          const conjugationResult = await conjugateVerb(verbToConjugate);
          if (conjugationResult?.conjugations?.length) {
            const mastery = buildEmptyMastery(conjugationResult.conjugations);
            await addWord({
              hebrew: conjugationResult.infinitive,
              translation: conjugationResult.spanishTranslation,
              conjugations: conjugationResult.conjugations,
              mastery,
            });
          } else {
            await addWord({
              hebrew: word.hebrew,
              translation: word.translation,
            });
          }
        } catch (conjugationError) {
          console.warn("Could not conjugate verb, saving without conjugations:", conjugationError);
          await addWord({
            hebrew: word.hebrew,
            translation: word.translation,
          });
        }
      } else {
        await addWord({
          hebrew: word.hebrew,
          translation: word.translation,
        });
      }

      setAddedWords((prev) => new Set(prev).add(wordKey));
      await checkWordsInDatabase();
    } catch (err) {
      console.error("Failed to add word to vocabulary:", err);
      setError("Error al agregar palabra al vocabulario");
    } finally {
      setAddingWords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(wordKey);
        return newSet;
      });
    }
  };

  const handlePlayAudio = async () => {
    if (!summary) return;

    const audioText = headline ? `${headline}. ${summary}` : summary;
    setIsGeneratingAudio(true);
    setAudioError(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const response = await textToSpeech(audioText);
      const audioBlob = Uint8Array.from(atob(response.audioContent), (c) => c.charCodeAt(0));
      const newAudioUrl = URL.createObjectURL(
        new Blob([audioBlob], { type: `audio/${response.audioEncoding.toLowerCase()}` })
      );
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

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const getWordKey = useCallback((word: VocabularyWord): string => {
    return `${word.hebrew}-${word.translation}`;
  }, []);

  const showContent = useMemo(() => {
    return !isLoading && summary;
  }, [isLoading, summary]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white px-5 pb-40 pt-8">
      <div className="mb-6 flex items-center justify-between">
        <Button onClick={() => router.push("/news")} variant="outline" size="sm">
          ← Volver
        </Button>
        {!audioUrl && (
          <Button
            onClick={handlePlayAudio}
            variant="secondary"
            size="sm"
            disabled={isGeneratingAudio || !summary}
          >
            {isGeneratingAudio ? "Generando..." : "🔊 Escuchar"}
          </Button>
        )}
      </div>

      <h1 className="mb-6 text-center text-3xl font-extrabold text-feather-text">
        Noticias
      </h1>

      {error && (
        <Card className="mb-6 border-feather-red bg-red-50 text-feather-red">
          <div className="font-bold">{error}</div>
        </Card>
      )}

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

      {isLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 text-lg font-bold text-feather-text-light">
            Generando resumen...
          </div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-feather-blue border-t-transparent"></div>
        </div>
      )}

      {showContent && (
        <div className="space-y-6">
          {headline && (
            <Card className="p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-feather-text-light">
                Titular
              </div>
              <div className="mt-2 text-2xl font-extrabold text-feather-text" dir="rtl">
                {headline}
              </div>
              {headlineTranslation && (
                <div className="mt-2 text-sm font-semibold text-feather-text-light" dir="ltr">
                  {headlineTranslation}
                </div>
              )}
            </Card>
          )}

          {summary && (
            <InteractiveReading
              text={summary}
              vocabularyWords={vocabularyWords}
              usedWords={usedWords}
              onWordClick={setSelectedWord}
              selectedWord={selectedWord}
            />
          )}

          {translation && (
            <Card className="bg-blue-50 border-feather-blue">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-feather-blue">
                Traducción
              </div>
              <div className="text-lg font-bold text-feather-text" dir="ltr">
                {translation}
              </div>
            </Card>
          )}

          {selectedWord && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setSelectedWord(null)}
            >
              <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
                <VocabularyFlashcard
                  word={selectedWord}
                  onAddToVocabulary={async (word) => {
                    await handleAddToVocabulary(word);
                  }}
                  isAdding={addingWords.has(getWordKey(selectedWord))}
                  isAdded={addedWords.has(getWordKey(selectedWord))}
                />
                <div className="mt-4">
                  <Button
                    onClick={() => setSelectedWord(null)}
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
