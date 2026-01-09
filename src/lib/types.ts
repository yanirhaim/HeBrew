// Types for future logic implementation

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
