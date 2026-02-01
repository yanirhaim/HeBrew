"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FlashcardProps {
  hebrew: string;
  translation: string;
  options: string[];
  selectedOption?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  onSelect: (option: string) => void;
}

export default function Flashcard({ 
  hebrew, 
  translation, 
  options, 
  selectedOption,
  showFeedback = false,
  isCorrect,
  onSelect 
}: FlashcardProps) {
  return (
    <Card className="w-full flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 text-sm font-bold uppercase tracking-wide text-feather-text-light">
        ¿Cuál es el significado?
      </div>
      <div className="mb-8 text-5xl font-extrabold text-feather-text" dir="rtl">
        {hebrew}
      </div>
      
      <div className="w-full grid grid-cols-1 gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === translation;
          
          let variant: "primary" | "secondary" | "outline" | "danger" = "outline";
          if (showFeedback) {
            if (isCorrectOption) {
              variant = "primary"; // Green for correct
            } else if (isSelected && !isCorrectOption) {
              variant = "danger"; // Red for wrong selection
            }
          } else if (isSelected) {
            variant = "secondary"; // Blue for selected
          }
          
          return (
            <Button
              key={idx}
              variant={variant}
              onClick={() => !showFeedback && onSelect(option)}
              fullWidth
              className="h-16 text-lg"
              disabled={showFeedback}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
