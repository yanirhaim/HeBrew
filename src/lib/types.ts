// Types for future logic implementation

export interface PracticeExercise {
  id: string;
  type: "multiple_choice" | "input";
  tense: "past" | "present" | "future";
  pronounCode?: string; // normalized key (ani, ata_m, at_f, hu_m, hi_f, anachnu, atem_m, aten_f, hem_m, hen_f)
  pronounLabel?: string; // human-friendly pronoun string (e.g., "אני (I)")
  sentence: string; // The sentence with a blank (e.g., "_____ הלכתי למכולת")
  correctAnswer: string;
  options?: string[]; // For multiple choice
  translation: string; // Spanish translation of the sentence
  hint?: string;
}

export interface Conjugation {
  pronoun: string;
  pronounCode?: string;
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

export type MasteryByTense = {
  past: Record<string, number>;
  present: Record<string, number>;
  future: Record<string, number>;
};

export interface Mistake {
  id: string;
  wordId: string;
  type: "gender" | "pattern" | "pronunciation" | "vocabulary";
  userAnswer: string;
  correctAnswer: string;
  timestamp: Date;
  context?: string; // Sentence where the mistake happened
}

export interface Word {
  id: string;
  hebrew: string;
  translation: string;
  createdAt: Date;
  masteryLevel?: number;
  mastery?: MasteryByTense;
  conjugations?: Conjugation[];
  nextReviewDate?: Date;
  consecutiveCorrect?: number;
  errorCount?: number;
}

export interface TranslationResult {
  original: string;
  translated: string;
  direction: "he-to-es" | "es-to-he";
}

export interface VocabularyWord {
  hebrew: string;           // Hebrew word (infinitive for verbs)
  translation: string;      // Spanish translation
  phonetic?: string;        // Spanish phonetic transliteration
  wordType: "verb" | "noun" | "adjective" | "adverb" | "other";
  infinitive?: string;      // For verbs, same as hebrew (already infinitive)
}
