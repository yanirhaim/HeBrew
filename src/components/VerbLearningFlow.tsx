"use client";

import { useState } from "react";
import { Conjugation } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import VerbLearningCard from "./VerbLearningCard";

interface VerbLearningFlowProps {
  conjugations: Conjugation[];
  tense: "past" | "present" | "future";
  onComplete: () => void;
}

export default function VerbLearningFlow({ conjugations, tense, onComplete }: VerbLearningFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalItems = conjugations.length;
  const progress = ((currentIndex + 1) / totalItems) * 100;

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((prev) => prev + 1);
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
      {/* Tense Title */}
      <div className="flex justify-center mb-6">
          <div className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide bg-feather-blue text-white shadow-md">
            {tense} Tense
          </div>
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
        <VerbLearningCard conjugation={currentConjugation} tense={tense} />
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
