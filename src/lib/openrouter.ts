import { Conjugation, PracticeExercise } from "./types";

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
      throw new Error(errorData.error || "Failed to conjugate verb");
    }

    const data: ConjugationApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while conjugating verb");
  }
}

export interface TranslationApiResponse {
  translation: string;
  isVerb: boolean;
  verbForm: string | null;
  spanishTranslation: string | null;
  conjugations: Conjugation[] | null;
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
      throw new Error(errorData.error || "Failed to translate text");
    }

    const data: TranslationApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while translating text");
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
      throw new Error(errorData.error || "Failed to generate exercises");
    }

    const data: PracticeApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error occurred while generating exercises");
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

export async function fetchConjugationAndPractice(verb: string) {
  const [conjugation, practice] = await Promise.all([
    conjugateVerb(verb),
    generatePracticeExercises(verb),
  ]);

  cachePracticePayload(verb, practice);

  return { conjugation, practice };
}
