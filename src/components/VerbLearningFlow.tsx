"use client";

import { useState } from "react";
import { Conjugation } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import VerbLearningCard from "./VerbLearningCard";

interface VerbLearningFlowProps {
  conjugations: Conjugation[];
  onComplete: () => void;
}

export default function VerbLearningFlow({ conjugations, onComplete }: VerbLearningFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTense, setCurrentTense] = useState<"past" | "present" | "future">("present");

  const totalItems = conjugations.length;
  const progress = ((currentIndex + 1) / totalItems) * 100;

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // If at the end of a tense, maybe cycle or just finish
      // For simplicity, let's keep it manual per tense or cycle tenses?
      // The plan said "Tense tabs (Past, Present, Future) to filter/jump."
      // Let's implement Next to just go to next pronoun in current tense.
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const currentConjugation = conjugations[currentIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Tense Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {(["past", "present", "future"] as const).map((tense) => (
          <button
            key={tense}
            onClick={() => {
                setCurrentTense(tense);
                setCurrentIndex(0); // Reset to first pronoun when switching tense
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all ${
              currentTense === tense
                ? "bg-feather-blue text-white shadow-md"
                : "bg-white text-feather-text-light hover:bg-feather-gray/20"
            }`}
          >
            {tense}
          </button>
        ))}
      </div>

      {/* Progress Bar for current tense pronouns */}
      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-feather-gray/20">
        <div 
          className="h-full bg-feather-yellow transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card Area */}
      <div className="flex-1 mb-8">
        <VerbLearningCard conjugation={currentConjugation} tense={currentTense} />
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-auto">
        <Button
            variant="secondary"
            className="flex-1"
            onClick={handlePrev}
            disabled={currentIndex === 0}
        >
            PREV
        </Button>
        
        {currentIndex === totalItems - 1 ? (
             <Button
                variant="primary"
                className="flex-1"
                onClick={onComplete}
             >
                 START QUIZ
             </Button>
        ) : (
            <Button
                variant="secondary"
                className="flex-1"
                onClick={handleNext}
            >
                NEXT
            </Button>
        )}
      </div>
      
      {/* Always visible Start Quiz button if user wants to skip */}
      {currentIndex !== totalItems - 1 && (
          <div className="mt-4 text-center">
              <button 
                onClick={onComplete}
                className="text-sm font-bold text-feather-text-light hover:text-feather-blue uppercase tracking-wide"
              >
                  Skip to Quiz
              </button>
          </div>
      )}
    </div>
  );
}
