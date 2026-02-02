import { VocabularyWord } from "@/lib/types";
import { generateCandidateForms, tokenizeHebrewText } from "@/lib/hebrew-text";

export type DbWord = {
  hebrew: string;
  translation: string;
  id: string;
  conjugations?: unknown;
};

export const buildDbWordIndex = (words: DbWord[]) => {
  const index = new Map<string, DbWord>();
  for (const word of words) {
    const forms = generateCandidateForms(word.hebrew);
    for (const form of forms) {
      if (!index.has(form)) {
        index.set(form, word);
      }
    }
  }
  return index;
};

export const buildVocabFromText = (text: string, words: DbWord[]) => {
  const tokens = tokenizeHebrewText(text);
  const uniqueTokens: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (!seen.has(token)) {
      seen.add(token);
      uniqueTokens.push(token);
    }
  }

  const index = buildDbWordIndex(words);
  const usedWordsMap = new Map<string, DbWord>();
  const knownVocab: VocabularyWord[] = [];
  const unknownTokens: string[] = [];

  for (const token of uniqueTokens) {
    const forms = generateCandidateForms(token);
    const matched = forms.map((f) => index.get(f)).find(Boolean);
    if (matched) {
      usedWordsMap.set(matched.id, matched);
      knownVocab.push({
        hebrew: token,
        translation: matched.translation,
        wordType: matched.conjugations ? "verb" : "other",
        infinitive: matched.conjugations ? matched.hebrew : undefined,
      });
    } else {
      unknownTokens.push(token);
    }
  }

  return {
    tokens: uniqueTokens,
    unknownTokens,
    knownVocab,
    usedWords: Array.from(usedWordsMap.values()),
  };
};
