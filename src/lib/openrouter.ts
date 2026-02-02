import { Conjugation, PracticeExercise, VocabularyWord } from "./types";

export interface ConjugationApiResponse {
  infinitive: string;
  spanishTranslation: string;
  conjugations: Conjugation[];
}

export interface PracticeApiResponse {
  verbInfinitive: string;
  spanishTranslation: string;
  exercises: PracticeExercise[];
  conjugations: Conjugation[];
}

export interface ConjugationError {
  error: string;
  details?: string;
}

export async function conjugateVerb(
  verb: string
): Promise<ConjugationApiResponse> {
  try {
    const response = await fetch("/api/conjugate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ verb }),
    });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al conjugar el verbo");
    }

    const data: ConjugationApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al conjugar el verbo");
  }
}

export interface TranslationApiResponse {
  translation: string;
  vocabularyWords: VocabularyWord[];
}

export interface ReadingApiResponse {
  text: string;
  translation?: string;
  vocabularyWords: VocabularyWord[];
  usedWords?: Array<{
    hebrew: string;
    translation: string;
    id: string;
  }>;
}

export interface NewsListItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  imageUrl?: string;
}

export interface NewsListResponse {
  source: string;
  feedUrl: string;
  items: NewsListItem[];
}

export interface NewsSummaryResponse {
  headline: string;
  headlineTranslation?: string;
  summary: string;
  translation?: string;
  vocabularyWords: VocabularyWord[];
  usedWords?: Array<{
    hebrew: string;
    translation: string;
    id: string;
  }>;
}

export async function translateText(
  text: string,
  direction: "he-to-es" | "es-to-he"
): Promise<TranslationApiResponse> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, direction }),
    });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al traducir el texto");
    }

    const data: TranslationApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al traducir el texto");
  }
}

export async function generatePracticeExercises(
  verb: string
): Promise<PracticeApiResponse> {
  try {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ verb }),
    });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al generar ejercicios");
    }

    const data: PracticeApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al generar ejercicios");
  }
}

export function cachePracticePayload(verb: string, payload: PracticeApiResponse) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `practice-cache:${verb}`,
      JSON.stringify({
        ...payload,
        cachedAt: Date.now()
      })
    );
  } catch (error) {
    console.warn("Unable to cache practice payload", error);
  }
}

export function readCachedPracticePayload(verb: string): PracticeApiResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`practice-cache:${verb}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.exercises && parsed?.conjugations) {
      return parsed as PracticeApiResponse;
    }
  } catch (error) {
    console.warn("Unable to read cached practice payload", error);
  }
  return null;
}

export async function generateReading(
  length: "short" | "medium" | "long"
): Promise<ReadingApiResponse> {
  try {
    const response = await fetch("/api/reading", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ length }),
    });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al generar lectura");
    }

    const data: ReadingApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al generar lectura");
  }
}

export async function fetchNewsList(): Promise<NewsListResponse> {
  try {
    const response = await fetch("/api/news", { method: "GET" });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al cargar noticias");
    }

    const data: NewsListResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al cargar noticias");
  }
}

export async function summarizeNewsItem(item: NewsListItem): Promise<NewsSummaryResponse> {
  try {
    const response = await fetch("/api/news/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al resumir noticia");
    }

    const data: NewsSummaryResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al resumir noticia");
  }
}

export function cacheDailyNewsPayload(payload: NewsSummaryResponse, cacheKey: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `news-cache:${cacheKey}`,
      JSON.stringify({
        ...payload,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn("Unable to cache news payload", error);
  }
}

export function readCachedDailyNewsPayload(cacheKey: string): NewsSummaryResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`news-cache:${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.headline && parsed?.summary && parsed?.vocabularyWords) {
      return parsed as NewsSummaryResponse;
    }
  } catch (error) {
    console.warn("Unable to read cached news payload", error);
  }
  return null;
}

export interface TextToSpeechApiResponse {
  audioContent: string; // Base64-encoded audio
  audioEncoding: string;
}

export async function textToSpeech(text: string): Promise<TextToSpeechApiResponse> {
  try {
    const response = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData: ConjugationError = await response.json();
      throw new Error(errorData.error || "Error al generar audio");
    }

    const data: TextToSpeechApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al generar audio");
  }
}

export async function fetchConjugationAndPractice(verb: string) {
  const [conjugation, practice] = await Promise.all([
    conjugateVerb(verb),
    generatePracticeExercises(verb),
  ]);

  cachePracticePayload(verb, practice);

  return { conjugation, practice };
}
