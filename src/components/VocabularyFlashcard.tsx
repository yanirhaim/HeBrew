"use client";

import { VocabularyWord } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface VocabularyFlashcardProps {
  word: VocabularyWord;
  onAddToVocabulary: (word: VocabularyWord) => void;
  isAdding?: boolean;
  isAdded?: boolean;
}

const wordTypeLabels: Record<VocabularyWord["wordType"], string> = {
  verb: "Verbo",
  noun: "Sustantivo",
  adjective: "Adjetivo",
  adverb: "Adverbio",
  other: "Otra",
};

export default function VocabularyFlashcard({ 
  word, 
  onAddToVocabulary,
  isAdding = false,
  isAdded = false
}: VocabularyFlashcardProps) {
  const handleAdd = () => {
    if (!isAdded) {
      onAddToVocabulary(word);
    }
  };

  const getButtonText = () => {
    if (isAdded) {
      return "AGREGADO ✓";
    }
    if (isAdding) {
      return word.wordType === "verb" ? "CONJUGANDO..." : "AGREGANDO...";
    }
    return "AGREGAR AL VOCABULARIO";
  };

  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] mb-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-feather-text-light">
        {wordTypeLabels[word.wordType]}
      </div>
      
      <div className="mb-6 text-5xl font-extrabold text-feather-text" dir="rtl">
        {word.hebrew}
      </div>
      
      {word.phonetic && (
        <div className="mb-4 text-xl font-medium text-feather-text-light">
          {word.phonetic}
        </div>
      )}
      
      <div className="mb-8 text-2xl font-bold text-feather-blue">
        {word.translation}
      </div>

      <Button
        variant={isAdded ? "outline" : "primary"}
        size="lg"
        fullWidth
        onClick={handleAdd}
        disabled={isAdding || isAdded}
        className={isAdded ? "text-feather-text-light border-feather-gray/30" : ""}
      >
        {getButtonText()}
      </Button>
    </Card>
  );
}
