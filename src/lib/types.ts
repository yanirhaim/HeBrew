// Types for future logic implementation

export interface PracticeExercise {
  id: string;
  type: "multiple_choice" | "input";
  sentence: string; // The sentence with a blank (e.g., "_____ הלכתי למכולת")
  correctAnswer: string;
  options?: string[]; // For multiple choice
  translation: string; // Spanish translation of the sentence
  hint?: string;
}

export interface Conjugation {
  pronoun: string;
  past: string;
  pastTransliteration?: string;
  pastExample?: string;
  present: string;
  presentTransliteration?: string;
  presentExample?: string;
  future: string;
  futureTransliteration?: string;
  futureExample?: string;
}

export interface Word {
  id: string;
  hebrew: string;
  translation: string;
  createdAt: Date;
}

export interface TranslationResult {
  original: string;
  translated: string;
  direction: "he-to-es" | "es-to-he";
}
