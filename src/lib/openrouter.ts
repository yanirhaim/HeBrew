import { Conjugation } from "./types";

export interface ConjugationApiResponse {
  spanishTranslation: string;
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
