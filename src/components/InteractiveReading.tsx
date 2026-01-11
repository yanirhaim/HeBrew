"use client";

import { VocabularyWord, Word } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface InteractiveReadingProps {
  text: string;
  vocabularyWords: VocabularyWord[];
  usedWords: Word[]; // Words already in DB
  onWordClick: (word: VocabularyWord) => void;
  selectedWord: VocabularyWord | null;
}

export default function InteractiveReading({
  text,
  vocabularyWords,
  usedWords,
  onWordClick,
  selectedWord,
}: InteractiveReadingProps) {
  // Create a map for quick lookup of vocabulary words by Hebrew text
  const vocabularyMap = new Map<string, VocabularyWord>();
  vocabularyWords.forEach((word) => {
    vocabularyMap.set(word.hebrew, word);
  });

  // Create a set of Hebrew words that are already in the database
  const usedHebrewWords = new Set(usedWords.map((w) => w.hebrew));

  // Split text into words while preserving punctuation and spaces
  // This regex splits on word boundaries but keeps Hebrew characters together
  const splitText = () => {
    const words: Array<{ text: string; isVocabulary: boolean; word?: VocabularyWord }> = [];
    const tokens = text.split(/(\s+|[.,;:!?()"—–-])/);

    for (const token of tokens) {
      if (!token.trim()) {
        words.push({ text: token, isVocabulary: false });
        continue;
      }

      // Try to find exact match in vocabulary
      const vocabularyWord = vocabularyMap.get(token.trim());
      if (vocabularyWord) {
        words.push({ text: token, isVocabulary: true, word: vocabularyWord });
      } else {
        words.push({ text: token, isVocabulary: false });
      }
    }

    return words;
  };

  const textParts = splitText();

  return (
    <Card className="p-6 mb-6">
      <div
        className="text-xl leading-relaxed text-feather-text"
        dir="rtl"
        style={{ lineHeight: "2" }}
      >
        {textParts.map((part, index) => {
          if (part.isVocabulary && part.word) {
            const isNewWord = !usedHebrewWords.has(part.word.hebrew);
            const isSelected = selectedWord?.hebrew === part.word.hebrew;

            return (
              <span
                key={index}
                onClick={() => onWordClick(part.word!)}
                className={`
                  inline-block cursor-pointer px-1 py-0.5 rounded transition-all
                  ${
                    isNewWord
                      ? "bg-green-100 text-feather-text hover:bg-green-200 font-bold"
                      : "bg-blue-100 text-feather-text hover:bg-blue-200 font-semibold"
                  }
                  ${isSelected ? "ring-2 ring-feather-blue ring-offset-1" : ""}
                `}
                title={part.word.translation}
              >
                {part.text}
              </span>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </div>
    </Card>
  );
}
